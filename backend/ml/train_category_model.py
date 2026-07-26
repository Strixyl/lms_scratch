"""
train_category_model.py
------------------------
Step 3 of the Naive Bayes category classification pipeline.

Loads the cleaned dataset (produced by clean_dataset.py), performs an
80/20 stratified train/validation split, sweeps hyperparameters for the
CategoryClassifier (TfidfVectorizer + MultinomialNB), evaluates the best
combination, and saves it to category_model.pkl for sentiment_service.py
to load at startup.

Usage:
    cd backend/ml
    python train_category_model.py

Input:
    data/clean_category_dataset.csv   (produced by clean_dataset.py)

Output:
    category_model.pkl                (best trained CategoryClassifier)
    alpha_search_category.png         (optional accuracy-vs-alpha plot)
"""

import os

import joblib
import pandas as pd
from sklearn.metrics import classification_report, confusion_matrix
from sklearn.model_selection import train_test_split

from naive_bayes import CategoryClassifier

# ── Paths ─────────────────────────────────────────────────────────────
THIS_DIR = os.path.dirname(os.path.abspath(__file__))
CLEAN_CSV_PATH = os.path.join(THIS_DIR, "data", "clean_category_dataset.csv")
MODEL_OUTPUT_PATH = os.path.join(THIS_DIR, "category_model.pkl")
PLOT_OUTPUT_PATH = os.path.join(THIS_DIR, "alpha_search_category.png")

RANDOM_STATE = 42
TEST_SIZE = 0.2

# Hyperparameter grid — kept small and readable rather than exhaustive,
# since the dataset is a clean, well-balanced 3,000 rows and doesn't need
# an aggressive search.
ALPHA_GRID = [0.01, 0.1, 0.5, 1.0, 1.5, 2.0, 5.0]
NGRAM_RANGE_GRID = [(1, 1), (1, 2)]
MIN_DF_GRID = [1, 2]


def load_data():
    if not os.path.exists(CLEAN_CSV_PATH):
        raise FileNotFoundError(
            f"Clean dataset not found at {CLEAN_CSV_PATH}. "
            f"Run clean_dataset.py first."
        )
    df = pd.read_csv(CLEAN_CSV_PATH)
    return df["comment"].astype(str).tolist(), df["category"].tolist()


def grid_search(X_train, y_train, X_val, y_val):
    """
    Sweeps alpha / ngram_range / min_df, returns (best_model, best_params,
    best_accuracy, all_results) where all_results is a list of dicts for
    logging/plotting.
    """
    best_model = None
    best_params = None
    best_accuracy = -1.0
    all_results = []

    for ngram_range in NGRAM_RANGE_GRID:
        for min_df in MIN_DF_GRID:
            for alpha in ALPHA_GRID:
                model = CategoryClassifier(
                    alpha=alpha, ngram_range=ngram_range, min_df=min_df
                )
                model.fit(X_train, y_train)
                acc = model.score(X_val, y_val)

                all_results.append({
                    "alpha": alpha,
                    "ngram_range": ngram_range,
                    "min_df": min_df,
                    "val_accuracy": acc,
                })

                if acc > best_accuracy:
                    best_accuracy = acc
                    best_model = model
                    best_params = {
                        "alpha": alpha,
                        "ngram_range": ngram_range,
                        "min_df": min_df,
                    }

    return best_model, best_params, best_accuracy, all_results


def maybe_plot(all_results):
    """
    Best-effort accuracy-vs-alpha plot for the methodology chapter.
    Skips silently if matplotlib isn't installed rather than failing the
    whole training run.
    """
    try:
        import matplotlib
        matplotlib.use("Agg")
        import matplotlib.pyplot as plt
    except ImportError:
        print("(matplotlib not installed — skipping alpha_search plot)")
        return

    df = pd.DataFrame(all_results)
    df["config"] = df["ngram_range"].astype(str) + " / min_df=" + df["min_df"].astype(str)

    plt.figure(figsize=(8, 5))
    for config, group in df.groupby("config"):
        group = group.sort_values("alpha")
        plt.plot(group["alpha"], group["val_accuracy"], marker="o", label=config)

    plt.xscale("log")
    plt.xlabel("alpha (log scale)")
    plt.ylabel("Validation accuracy")
    plt.title("Category Classifier — Alpha Sweep")
    plt.legend(fontsize=8)
    plt.tight_layout()
    plt.savefig(PLOT_OUTPUT_PATH)
    plt.close()
    print(f"Saved alpha sweep plot to: {PLOT_OUTPUT_PATH}")


def main():
    print(f"Loading cleaned dataset from: {CLEAN_CSV_PATH}")
    X, y = load_data()
    print(f"Total rows: {len(X)}")

    X_train, X_val, y_train, y_val = train_test_split(
        X, y, test_size=TEST_SIZE, random_state=RANDOM_STATE, stratify=y
    )
    print(f"Train rows: {len(X_train)}  |  Validation rows: {len(X_val)}")

    # ── Baseline ─────────────────────────────────────────────────────
    baseline = CategoryClassifier(alpha=1.0, ngram_range=(1, 1), min_df=1)
    baseline.fit(X_train, y_train)
    baseline_acc = baseline.score(X_val, y_val)
    print(f"\nBaseline (alpha=1.0, ngram_range=(1,1), min_df=1) accuracy: {baseline_acc:.4f}")

    # ── Grid search ──────────────────────────────────────────────────
    print(f"\nRunning grid search over "
          f"{len(ALPHA_GRID) * len(NGRAM_RANGE_GRID) * len(MIN_DF_GRID)} combinations...")
    best_model, best_params, best_accuracy, all_results = grid_search(
        X_train, y_train, X_val, y_val
    )

    print("\n" + "=" * 60)
    print("BEST MODEL")
    print("=" * 60)
    print(f"Params:   {best_params}")
    print(f"Val accuracy: {best_accuracy:.4f}")
    print(f"(baseline was: {baseline_acc:.4f})")

    # ── Detailed evaluation of the best model ───────────────────────
    y_pred = best_model.predict(X_val)
    print("\nClassification report (validation set):")
    print(classification_report(y_val, y_pred, digits=3))

    print("Confusion matrix (rows=actual, cols=predicted):")
    labels = sorted(set(y_val))
    cm = confusion_matrix(y_val, y_pred, labels=labels)
    cm_df = pd.DataFrame(cm, index=labels, columns=labels)
    print(cm_df.to_string())

    # ── Save ─────────────────────────────────────────────────────────
    joblib.dump(best_model, MODEL_OUTPUT_PATH)
    print(f"\nSaved best model to: {MODEL_OUTPUT_PATH}")

    maybe_plot(all_results)


if __name__ == "__main__":
    main()