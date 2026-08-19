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

try:
    from spellchecker import SpellChecker
except ImportError as exc:
    raise ImportError(
        "pyspellchecker is required for gibberish detection. Install it with: "
        "pip install pyspellchecker --break-system-packages"
    ) from exc
_spell = SpellChecker()


THIS_DIR = os.path.dirname(os.path.abspath(__file__))
RAW_XLSX_PATH = os.path.abspath(os.path.join(THIS_DIR, "..", "..", "dataset_11k.xlsx"))
if not os.path.exists(RAW_XLSX_PATH):
    RAW_XLSX_PATH = os.path.abspath(os.path.join(THIS_DIR, "..", "dataset_11k.xlsx"))
if not os.path.exists(RAW_XLSX_PATH):
    RAW_XLSX_PATH = os.path.abspath(os.path.join(THIS_DIR, "dataset_11k.xlsx"))

DATA_DIR = os.path.join(THIS_DIR, "data")
TEST_DIR = os.path.join(DATA_DIR, "test")

TRAIN_OUTPUT_CSV_PATH = os.path.join(DATA_DIR, "clean_category_dataset.csv")

SHEET_NAME = "All_Data"

VALID_CATEGORIES = ["Facilities", "Staff", "Collection", "Other/Uncategorized"]

# non informative static filler texts.
# Dynamic gibberish (e.g. "shdsuidhs", "asdfghj") and character repetitions ("walaaaaa")
# are automatically caught by character normalization & spellcheck/consonant filters.
NON_INFORMATIVE_TEXTS = {
    "none", "n/a", "na", "no", "nil", "nothing", "good", "okay", "ok", 
    "a", "b", "c", "thanks", "thank you", "n/a.", "none.", "good.",
    "nan", "null", "baby", "miss", "utut", "wioe", 
}

# Local Tagalog & library domain whitelist so legitimate patron feedback isn't flagged by English spellchecker
LOCAL_DOMAIN_WHITELIST = {
    "wala", "sana", "meron", "may", "din", "rin", "opo", "po", "cr", "wifi", "aircon", 
    "mabait", "maganda", "pangit", "tahimik", "maingay", "books", "book", "lib", "library"
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

    text_col = next((c for c in df.columns if str(c).strip().lower() in text_candidates), None)
    cat_col = next((c for c in df.columns if str(c).strip().lower() in cat_candidates), None)
    if not text_col:
        for c in df.columns:
            if df[c].dtype == object:
                text_col = c
                break
        if not text_col:
            raise KeyError(f"Could not find a text/feedback column in dataset columns: {df.columns.tolist()}")

    print(f"Mapped dataset columns -> Text: '{text_col}', Category: '{cat_col}'")

    # rename key columns
    df = df.rename(columns={text_col: "comment"})
    
    has_category = cat_col is not None
    if has_category:
        df = df.rename(columns={cat_col: "category"})
    else:
        df["category"] = "Unassigned"

    main_cols = ["comment", "category"]
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

    # Noise filter using multi-library spellcheck, consonant heuristics, and length thresholds
    def is_gibberish_token(word: str) -> bool:
        """Flags a single unbroken token (no spaces) as likely keyboard mashing,
        e.g. "shdsuidhs", "asdfghj", or 30+ character strings.
        """
        clean_w = word.lower().strip()
        if len(clean_w) >= 20:
            return True
        
        # 5+ consecutive consonants (e.g., "shdsu", "dfghj") usually indicates keyboard mashing
        if re.search(r"[bcdfghjklmnpqrstvwxyz]{5,}", clean_w):
            return True

        # Single-token spellcheck filter for unrecognized strings (e.g. "shdsuidhs")
        if len(clean_w) >= 4 and clean_w.isalpha() and clean_w not in LOCAL_DOMAIN_WHITELIST:
            # Check if it lacks vowels entirely (e.g., "hshdhd")
            if not any(v in clean_w for v in "aeiouy"):
                return True
            # Spellchecker dictionary verification
            unknown = _spell.unknown([clean_w])
            if len(unknown) == 1 and not clean_w.isupper() and len(clean_w) >= 6:
                return True

        return False

    def is_gibberish_multiword(val: str) -> bool:
        """Flags multi-word comments where almost every token is not a
        real English or whitelisted word (e.g. "asdf jkl qwerty lorem ipsum dolor").
        """
        tokens = [t.lower() for t in val.split() if t.isalpha() and len(t) >= 2]
        if len(tokens) < 3:
            return False
        
        # Filter out local domain whitelisted words before calculating unknown ratio
        non_whitelisted = [t for t in tokens if t not in LOCAL_DOMAIN_WHITELIST]
        if not non_whitelisted:
            return False

        unknown = _spell.unknown(non_whitelisted)
        return (len(unknown) / len(tokens)) >= 0.60

    def is_noise(val: str) -> bool:
        lower_val = val.lower()
        if lower_val in NON_INFORMATIVE_TEXTS:
            return True
        if len(val) < MIN_CHAR_LENGTH:
            return True
        if val.isdigit():  
            return True
        tokens = val.split()
        if len(tokens) == 1 and is_gibberish_token(tokens[0]):
            return True
        if len(tokens) >= 3 and is_gibberish_multiword(val):
            return True
        return False

    noise_mask = df["comment"].apply(is_noise)
    dropped_noise = df[noise_mask]
    df = df[~noise_mask]


    df["category"] = df["category"].astype(str).str.strip().str.title()

    dropped_bad_labels = pd.DataFrame()
    if has_category:
        bad_cat_mask = (df["category"] != "Unassigned") & (~df["category"].isin(VALID_CATEGORIES))
        dropped_bad_labels = df[bad_cat_mask]
        df = df[~bad_cat_mask]

    # drop duplicates: same comment text AND same category label is a
    # true redundant duplicate. Same comment text under a DIFFERENT
    # category is not redundant — short generic comments (e.g. "this
    # needs improvement") can legitimately apply to different things
    # across different patron submissions, and collapsing them away
    # would silently discard genuine cross-category ambiguity.
    before_dedupe = len(df)
    df = df.drop_duplicates(subset=["comment", "category"], keep="first")
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
    print("=" * 60)

    if len(dropped_noise) > 0:
        print("\nSample of dropped non-informative noise rows:")
        print(dropped_noise[["comment"]].head(10).to_string())

    if len(dropped_bad_labels) > 0:
        print("\nSample of dropped bad-label rows:")
        print(dropped_bad_labels[["comment", "category"]].head(10).to_string())

    return df


def main():
    args = [a for a in sys.argv[1:] if a.strip()]

    role = "train"
    positional = []
    for a in args:
        if a.strip().lower() in ("--role=train", "--train"):
            role = "train"
        elif a.strip().lower() in ("--role=test", "--test"):
            role = "test"
        elif a.strip().lower().startswith("--role="):
            role = a.split("=", 1)[1].strip().lower()
        else:
            positional.append(a)

    if role not in ("train", "test"):
        raise ValueError(f"--role must be 'train' or 'test', got: {role!r}")

    target_path = positional[0] if positional else RAW_XLSX_PATH

    if not os.path.exists(target_path):
        raise FileNotFoundError(f"Raw dataset not found at: {target_path}")

    print(f"Loading raw dataset from: {target_path}")
    print(f"Role: {role.upper()}")
    raw_df = load_raw(target_path, SHEET_NAME)

    clean_df = clean(raw_df)

    if role == "train":
        os.makedirs(DATA_DIR, exist_ok=True)
        out_path = TRAIN_OUTPUT_CSV_PATH
    else:
        os.makedirs(TEST_DIR, exist_ok=True)
        out_path = TEST_OUTPUT_CSV_PATH

    clean_df.to_csv(out_path, index=False, encoding="utf-8")
    print(f"\nSaved cleaned dataset to: {out_path}")

    if role == "test":
        print(
            "\n" + "!" * 60 +
            "\nTHIS IS A TEST-SET FILE — real/held-out data.\n"
            "Do NOT reference this path from train_category_model.py or\n"
            "any training/grid-search code. It exists only to be scored\n"
            "against an already-trained model.\n" + "!" * 60
        )


if __name__ == "__main__":
    main()