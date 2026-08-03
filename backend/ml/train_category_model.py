import os

import joblib
import pandas as pd
from sklearn.metrics import classification_report, confusion_matrix
from sklearn.model_selection import train_test_split

from naive_bayes import CategoryClassifier

THIS_DIR = os.path.dirname(os.path.abspath(__file__))
CLEAN_CSV_PATH = os.path.join(THIS_DIR, "data", "clean_category_dataset.csv")
MANUAL_CSV_PATH = os.path.join(THIS_DIR, "data", "manual_boundary_cases.csv")
MODEL_OUTPUT_PATH = os.path.join(THIS_DIR, "category_model.pkl")

RANDOM_STATE = 42
TEST_SIZE = 0.2


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

    if os.path.exists(MANUAL_CSV_PATH):
        manual_df = pd.read_csv(MANUAL_CSV_PATH)
        # manual_boundary_cases.csv only has comment,category (no sentiment) —
        # align columns so concat doesn't introduce all-NaN mismatches
        for col in df.columns:
            if col not in manual_df.columns:
                manual_df[col] = "Unassigned"
        manual_df = manual_df[df.columns]
        print(f"Merging {len(manual_df)} manual boundary-case rows from {MANUAL_CSV_PATH}")
        df = pd.concat([df, manual_df], ignore_index=True)
    else:
        print(
            f"WARNING: manual boundary-case file not found at {MANUAL_CSV_PATH} "
            f"— training WITHOUT the hand-written boundary cases."
        )

    return df["comment"].astype(str).tolist(), df["category"].tolist()


def grid_search(X_train, y_train, X_val, y_val):
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


def main():
    print(f"Loading cleaned dataset from: {CLEAN_CSV_PATH}")
    X, y = load_data()
    print(f"Total rows: {len(X)}")

    X_train, X_val, y_train, y_val = train_test_split(
        X, y, test_size=TEST_SIZE, random_state=RANDOM_STATE, stratify=y
    )
    print(f"Train rows: {len(X_train)}  |  Validation rows: {len(X_val)}")

    baseline = CategoryClassifier(alpha=1.0, ngram_range=(1, 1), min_df=1)
    baseline.fit(X_train, y_train)
    baseline_acc = baseline.score(X_val, y_val)
    print(f"\nBaseline (alpha=1.0, ngram_range=(1,1), min_df=1) accuracy: {baseline_acc:.4f}")

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

    y_pred = best_model.predict(X_val)
    print("\nClassification report (validation set):")
    print(classification_report(y_val, y_pred, digits=3))

    print("Confusion matrix (rows=actual, cols=predicted):")
    labels = sorted(set(y_val))
    cm = confusion_matrix(y_val, y_pred, labels=labels)
    cm_df = pd.DataFrame(cm, index=labels, columns=labels)
    print(cm_df.to_string())

    joblib.dump(best_model, MODEL_OUTPUT_PATH)
    print(f"\nSaved best model to: {MODEL_OUTPUT_PATH}")


if __name__ == "__main__":
    main()