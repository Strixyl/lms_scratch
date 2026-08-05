import re
import sys
import os
import pandas as pd

try:
    from cleantext import clean as ct_clean
except ImportError as exc:
    raise ImportError(
        "clean-text is required for noise normalization. Install it with: "
        "pip install clean-text --break-system-packages"
    ) from exc


THIS_DIR = os.path.dirname(os.path.abspath(__file__))
RAW_XLSX_PATH = os.path.abspath(os.path.join(THIS_DIR, "..", "..", "3kwithnoise.xlsx"))

OUTPUT_DIR = os.path.join(THIS_DIR, "data")
OUTPUT_CSV_PATH = os.path.join(OUTPUT_DIR, "clean_category_dataset.csv")

SHEET_NAME = "All_Data"

VALID_CATEGORIES = ["Facilities", "Staff", "Collection", "Other/Uncategorized"]
VALID_SENTIMENTS = ["Positive", "Neutral", "Negative"]

# non informative text./ mkixed with actual comments from real survey dataset
NON_INFORMATIVE_TEXTS = {
    "none", "n/a", "na", "no", "nil", "nothing", "good", "okay", "ok", 
    "asdf", "a", "b", "c", "thanks", "thank you", "n/a.", "none.", "good.",
    "wala", "walaaaaa", "walaaaaaaaaaaaaa", "nan", "null"
}

MIN_CHAR_LENGTH = 3


def normalize_text(val: str) -> str:
    """Normalize a raw comment using clean-text, then collapse excessive
    character repetition (e.g. "GGGreat" -> "GGreat", "bagssss" -> "bagss")
    that clean-text does not handle on its own.
    """
    if val is None:
        return ""
    val = str(val)

    val = ct_clean(
        val,
        fix_unicode=True,       # fix mojibake / encoding artifacts
        to_ascii=True,          # transliterate accented/unicode chars
        lower=False,            # keep case; naive_bayes.preprocess() lowercases later
        no_line_breaks=True,
        no_urls=True,
        no_emails=True,
        no_phone_numbers=True,
        no_currency_symbols=True,
        no_punct=False,         # keep punctuation; helps preserve readability for review
        no_emoji=True,
        replace_with_url=" ",
        replace_with_email=" ",
        replace_with_phone_number=" ",
        replace_with_currency_symbol=" ",
    )

    # Collapse runs of 3+ identical characters down to 2
    # (keeps legitimate doubles like "book" / "class" intact)
    val = re.sub(r"(.)\1{2,}", r"\1\1", val)
    val = re.sub(r"\s+", " ", val).strip()
    return val


def load_raw(path: str, sheet_name: str = "All_Data") -> pd.DataFrame:
    if not os.path.exists(path):
        raise FileNotFoundError(f"Raw dataset not found at: {path}")
    
    ext = os.path.splitext(path)[1].lower()
    if ext == ".csv":
        return pd.read_csv(path)
    
    try:
        return pd.read_excel(path, sheet_name=sheet_name)
    except (ValueError, KeyError):
        return pd.read_excel(path, sheet_name=0)


def clean(df: pd.DataFrame) -> pd.DataFrame:
    df = df.copy()
    text_candidates = ["text", "message", "comment", "feedback", "comments", "response"]
    cat_candidates = ["category", "cat", "topic", "class", "label"]
    sent_candidates = ["sentiment", "sent", "polarity", "rating", "emotion"]

    text_col = next((c for c in df.columns if str(c).strip().lower() in text_candidates), None)
    cat_col = next((c for c in df.columns if str(c).strip().lower() in cat_candidates), None)
    sent_col = next((c for c in df.columns if str(c).strip().lower() in sent_candidates), None)
    if not text_col:
        for c in df.columns:
            if df[c].dtype == object:
                text_col = c
                break
        if not text_col:
            raise KeyError(f"Could not find a text/feedback column in dataset columns: {df.columns.tolist()}")

    print(f"Mapped dataset columns -> Text: '{text_col}', Category: '{cat_col}', Sentiment: '{sent_col}'")

    # rename key columns
    df = df.rename(columns={text_col: "comment"})
    
    has_category = cat_col is not None
    if has_category:
        df = df.rename(columns={cat_col: "category"})
    else:
        df["category"] = "Unassigned"

    has_sentiment = sent_col is not None
    if has_sentiment:
        df = df.rename(columns={sent_col: "sentiment"})
    else:
        df["sentiment"] = "Unassigned"

    main_cols = ["comment", "category", "sentiment"]
    other_cols = [c for c in df.columns if c not in main_cols]
    df = df[main_cols + other_cols]

    before = len(df)


    df["comment"] = df["comment"].astype(str).str.strip()

    #  drop empty comments/ or number only like 6767 
    df = df[df["comment"].notna()]
    df = df[df["comment"] != ""]
    df = df[df["comment"].str.lower() != "nan"]

    # normalize with clean-text (unicode/url/email/phone/emoji stripping) +
    # repeated-character collapse, BEFORE the noise check below, so noise
    # detection runs against normalized text (real-world typos, repeated
    # chars, and encoding artifacts no longer slip past the filter)
    df["comment"] = df["comment"].apply(normalize_text)
    df = df[df["comment"] != ""]

    # tihs part filters the noise less than 3 letters comments, along with non informative text from above
    def is_gibberish_token(word: str) -> bool:
        """Flags a single unbroken token (no spaces) as likely keyboard
        mashing, e.g. "dgasdfasgdgdashgdaswgsdagvsadvgsdagvsadgvadsgdas".
        Real English words used in casual feedback essentially never
        exceed ~18-19 characters (e.g. "characteristically" = 18,
        "disproportionately" = 18), while mashed strings tend to run
        30+ characters — a length-only cutoff at 20 avoids the false
        positives that vowel-ratio/consonant-run heuristics produce on
        legitimate long words (e.g. "straightforward").
        """
        return len(word) >= 20

    def is_noise(val: str) -> bool:
        lower_val = val.lower()
        if lower_val in NON_INFORMATIVE_TEXTS:
            return True
        if len(val) < MIN_CHAR_LENGTH:
            return True
        if val.isdigit():  
            return True
        # long single-token strings with no spaces (no real multi-word
        # comment structure) and low vowel density are almost always
        # keyboard mashing, not real feedback
        tokens = val.split()
        if len(tokens) == 1 and is_gibberish_token(tokens[0]):
            return True
        return False

    noise_mask = df["comment"].apply(is_noise)
    dropped_noise = df[noise_mask]
    df = df[~noise_mask]


    df["category"] = df["category"].astype(str).str.strip().str.title()
    df["sentiment"] = df["sentiment"].astype(str).str.strip().str.title()

    dropped_bad_labels = pd.DataFrame()
    if has_category or has_sentiment:
        bad_cat_mask = (df["category"] != "Unassigned") & (~df["category"].isin(VALID_CATEGORIES))
        bad_sent_mask = (df["sentiment"] != "Unassigned") & (~df["sentiment"].isin(VALID_SENTIMENTS))
        dropped_bad_labels = df[bad_cat_mask | bad_sent_mask]
        df = df[~(bad_cat_mask | bad_sent_mask)]

    # drop duplicates, only the first will remain/get
    before_dedupe = len(df)
    df = df.drop_duplicates(subset=["comment"], keep="first")
    dupes_dropped = before_dedupe - len(df)


    df = df.reset_index(drop=True)
    after = len(df)

    print("=" * 60)
    print("CLEANING SUMMARY")
    print("=" * 60)
    print(f"Rows before cleaning:                 {before}")
    print(f"Rows dropped (non-informative/short): {len(dropped_noise)}")
    print(f"Rows dropped (bad labels):             {len(dropped_bad_labels)}")
    print(f"Rows dropped (duplicates):             {dupes_dropped}")
    print(f"Rows after cleaning:                   {after}")
    print()
    print("Category distribution (post-clean):")
    print(df["category"].value_counts().to_string())
    print()
    print("Sentiment distribution (post-clean):")
    print(df["sentiment"].value_counts().to_string())
    print()
    if has_category and has_sentiment:
        print("Category x Sentiment crosstab:")
        print(pd.crosstab(df["category"], df["sentiment"]).to_string())
        print("=" * 60)

    if len(dropped_noise) > 0:
        print("\nSample of dropped non-informative noise rows:")
        print(dropped_noise[["comment"]].head(10).to_string())

    if len(dropped_bad_labels) > 0:
        print("\nSample of dropped bad-label rows:")
        print(dropped_bad_labels[["comment", "category", "sentiment"]].head(10).to_string())

    return df


def main():
    target_path = RAW_XLSX_PATH
    if len(sys.argv) > 1 and sys.argv[1].strip():
        target_path = sys.argv[1].strip()

    if not os.path.exists(target_path):
        raise FileNotFoundError(f"Raw dataset not found at: {target_path}")

    print(f"Loading raw dataset from: {target_path}")
    raw_df = load_raw(target_path, SHEET_NAME)

    clean_df = clean(raw_df)

    os.makedirs(OUTPUT_DIR, exist_ok=True)
    clean_df.to_csv(OUTPUT_CSV_PATH, index=False, encoding="utf-8")
    print(f"\nSaved cleaned dataset to: {OUTPUT_CSV_PATH}")


if __name__ == "__main__":
    main()