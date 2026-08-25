"""
Laplace (Additive) Smoothing Visualization for Naive Bayes
Henry Luce III Library Management System - Patron Feedback Categorizer

This script demonstrates and visualizes the "Zero-Frequency Problem" in Naïve Bayes
and how Laplace Smoothing (alpha = 1.0) prevents typos/unseen words from collapsing
the entire sentence probability to zero.
"""

import os
import matplotlib
matplotlib.use('Agg')  # Headless mode for clean, non-blocking image export
import matplotlib.pyplot as plt
import numpy as np

def run_visualization():
    # ── 1. Example Sentence with Real Words & Typos ──
    # Sentence: "The aircon is warm and the restrrom on 2nd flr is drity"
    tokens = ["aircon", "warm", "restrrom\n(typo)", "drity\n(typo)"]
    
    # Word counts in 'Facilities' category (Total words N = 5,000, Vocab |V| = 3,500)
    # "aircon" seen 120 times, "warm" seen 60 times, typos seen 0 times
    counts = np.array([120, 60, 0, 0])
    N_facilities = 5000
    vocab_size = 3500
    
    # ── 2. Calculate Probabilities ──
    # (A) Without Smoothing (alpha = 0) -> P(w | C) = Count / N
    p_no_smoothing = counts / N_facilities
    
    # (B) With Laplace Smoothing (alpha = 1.0) -> P(w | C) = (Count + 1) / (N + |V|)
    alpha = 1.0
    p_laplace = (counts + alpha) / (N_facilities + alpha * vocab_size)
    
    # ── 3. Calculate Joint Sentence Product ──
    # Without smoothing, 0 * anything = 0 (Total Collapse)
    joint_no_smoothing = np.prod(p_no_smoothing)
    # With smoothing, we get a viable non-zero probability
    joint_laplace = np.prod(p_laplace)

    # ── 4. Print Console Summary ──
    print("=" * 68)
    print("       LAPLACE SMOOTHING IN NAIVE BAYES (ALPHA = 1.0)")
    print("=" * 68)
    print(f"{'Token':<18} | {'No Smoothing (alpha=0)':<22} | {'Laplace Smoothing (alpha=1)':<25}")
    print("-" * 68)
    for token, p0, p1 in zip(["aircon", "warm", "restrrom (typo)", "drity (typo)"], p_no_smoothing, p_laplace):
        print(f"{token:<18} | {p0:<22.6f} | {p1:<25.6f}")
    print("-" * 68)
    print(f"{'JOINT PRODUCT':<18} | {joint_no_smoothing:<22.6e} | {joint_laplace:<25.6e}")
    print("=" * 68)
    print("RESULT:")
    print("  [FAIL] Alpha = 0.0 : Total score collapsed to 0.0000 because of typos.")
    print("  [PASS] Alpha = 1.0 : Preserved valid non-zero score for 'Facilities'!")
    print("=" * 68)

    # ── 5. Generate Matplotlib Plot ──
    fig, (ax1, ax2) = plt.subplots(1, 2, figsize=(13, 5))
    fig.patch.set_facecolor('#ffffff')

    # Subplot 1: Word-Level Probability Comparison
    x = np.arange(len(tokens))
    bar_width = 0.35

    bars1 = ax1.bar(x - bar_width/2, p_no_smoothing, bar_width, label='Without Smoothing (alpha = 0)', color='#ef4444', edgecolor='#b91c1c')
    bars2 = ax1.bar(x + bar_width/2, p_laplace, bar_width, label='With Laplace Smoothing (alpha = 1.0)', color='#3b82f6', edgecolor='#1d4ed8')

    ax1.set_title('Token Probability P(token | Facilities)', fontsize=13, fontweight='bold', pad=12)
    ax1.set_xticks(x)
    ax1.set_xticklabels(tokens, fontsize=10)
    ax1.set_ylabel('Probability Score', fontsize=11)
    ax1.legend(frameon=True, facecolor='#f8fafc', edgecolor='#cbd5e1')
    ax1.grid(axis='y', linestyle='--', alpha=0.5)

    # Annotate the zero-probability bars
    ax1.annotate('Fatal Zero (0.0)\nKills Calculation!', xy=(2 - bar_width/2, 0), xytext=(2 - bar_width/2 - 0.25, 0.006),
                 arrowprops=dict(facecolor='#ef4444', shrink=0.05, width=1.5, headwidth=6),
                 fontsize=8.5, fontweight='bold', color='#b91c1c')

    # Subplot 2: Cumulative Sentence Product Comparison
    labels = ['Without Smoothing\n(alpha = 0)', 'With Laplace\n(alpha = 1.0)']
    scores = [joint_no_smoothing * 1e12, joint_laplace * 1e12]
    colors = ['#ef4444', '#10b981']

    bars_joint = ax2.bar(labels, scores, color=colors, width=0.45, edgecolor='#334155')
    ax2.set_title('Cumulative Joint Likelihood (x 10^-12)', fontsize=13, fontweight='bold', pad=12)
    ax2.set_ylabel('Score (x 10^-12)', fontsize=11)
    ax2.grid(axis='y', linestyle='--', alpha=0.5)

    for bar in bars_joint:
        h = bar.get_height()
        ax2.text(bar.get_x() + bar.get_width()/2., h + (0.05 if h > 0 else 0.02),
                 f"{h:.4f}" if h > 0 else "0.0000 (COLLAPSE)",
                 ha='center', va='bottom', fontsize=10, fontweight='bold',
                 color='#15803d' if h > 0 else '#b91c1c')

    plt.suptitle("How Laplace Smoothing Prevents Typos from Breaking Naive Bayes Classification", fontsize=13, fontweight='bold', y=1.02)
    plt.tight_layout()

    output_path = os.path.join(os.path.dirname(__file__), "laplace_smoothing_visualization.png")
    plt.savefig(output_path, dpi=300, bbox_inches='tight')
    print(f"\n[OK] Visualization image successfully saved to:\n     {output_path}")

if __name__ == "__main__":
    run_visualization()
