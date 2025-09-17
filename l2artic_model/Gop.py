import nltk
import re
from transformers import pipeline
from g2p_en import G2p
import math

# Full ARPAbet -> IPA mapping (common phones). This list covers standard CMU ARPAbet symbols.
ARPABET_TO_IPA = {
    'AA': 'ɑ', 'AE': 'æ', 'AH': 'ʌ', 'AO': 'ɔ', 'AW': 'aʊ', 'AY': 'aɪ',
    'B': 'b', 'CH': 'tʃ', 'D': 'd', 'DH': 'ð', 'EH': 'ɛ', 'ER': 'ɝ',
    'EY': 'eɪ', 'F': 'f', 'G': 'g', 'HH': 'h', 'IH': 'ɪ', 'IY': 'i',
    'JH': 'dʒ', 'K': 'k', 'L': 'l', 'M': 'm', 'N': 'n', 'NG': 'ŋ',
    'OW': 'oʊ', 'OY': 'ɔɪ', 'P': 'p', 'R': 'r', 'S': 's', 'SH': 'ʃ',
    'T': 't', 'TH': 'θ', 'UH': 'ʊ', 'UW': 'u', 'V': 'v', 'W': 'w',
    'Y': 'j', 'Z': 'z', 'ZH': 'ʒ',
    # less common / diphthongs
    'AX': 'ə', 'AXR': 'ɚ', 'IX': 'i', 'EL': 'l̩', 'EM': 'm̩', 'EN': 'n̩',
    'NX': 'n', 'Q': '',
}


def ensure_cmudict():
    try:
        from nltk.corpus import cmudict
        _ = cmudict.dict()
    except Exception:
        nltk.download('cmudict', quiet=True)


def normalize_ipa(ipa_string):
    """Normalize IPA-like strings into token list (split by whitespace, remove empties)."""
    if ipa_string is None:
        return []
    return [p.strip() for p in ipa_string.split() if p.strip()]


def arpabet_list_to_ipa(arp_tokens, ignore_stress=True):
    """Convert a list of ARPAbet tokens (may include stress digits) to IPA tokens.

    If ignore_stress is True, strip digits (0/1/2). Otherwise, preserve stress markers
    by returning a tuple (ipa, stress) or embedding a stress marker — here we simply strip.
    """
    out = []
    for t in arp_tokens:
        if ignore_stress:
            t_clean = ''.join(ch for ch in t if not ch.isdigit())
        else:
            # keep token as-is (still map without digit but you might track stress separately)
            t_clean = ''.join(ch for ch in t if not ch.isdigit())
        ipa = ARPABET_TO_IPA.get(t_clean)
        out.append(ipa if ipa is not None else f'[{t_clean}]')
    return out


def levenshtein(a, b):
    n, m = len(a), len(b)
    if n == 0: return m
    if m == 0: return n
    dp = [[0] * (m + 1) for _ in range(n + 1)]
    for i in range(n + 1): dp[i][0] = i
    for j in range(m + 1): dp[0][j] = j
    for i in range(1, n + 1):
        for j in range(1, m + 1):
            cost = 0 if a[i-1] == b[j-1] else 1
            dp[i][j] = min(dp[i-1][j] + 1, dp[i][j-1] + 1, dp[i-1][j-1] + cost)
    return dp[n][m]


def align_with_ops(ref, hyp):
    n, m = len(ref), len(hyp)
    dp = [[0] * (m + 1) for _ in range(n + 1)]
    for i in range(1, n + 1): dp[i][0] = i
    for j in range(1, m + 1): dp[0][j] = j
    for i in range(1, n + 1):
        for j in range(1, m + 1):
            cost = 0 if ref[i-1] == hyp[j-1] else 1
            dp[i][j] = min(dp[i-1][j] + 1, dp[i][j-1] + 1, dp[i-1][j-1] + cost)
    i, j = n, m
    ops = []
    while i > 0 or j > 0:
        if i > 0 and j > 0 and dp[i][j] == dp[i-1][j-1] + (0 if ref[i-1] == hyp[j-1] else 1):
            ops.append(('M' if ref[i-1] == hyp[j-1] else 'S', ref[i-1], hyp[j-1]))
            i -= 1; j -= 1
        elif i > 0 and dp[i][j] == dp[i-1][j] + 1:
            ops.append(('D', ref[i-1], None)); i -= 1
        else:
            ops.append(('I', None, hyp[j-1])); j -= 1
    ops.reverse()
    return ops


def word_colors_from_alignment(ref_words, ref_phones_per_word, pred_phones, thresholds=(0.0, 0.3)):
    # flatten ref phones and map index to word
    flat_ref = []
    ref2word = []
    for wi, phones in enumerate(ref_phones_per_word):
        for p in phones:
            flat_ref.append(p); ref2word.append(wi)
    ops = align_with_ops(flat_ref, pred_phones)
    word_ref_count = [len(p) for p in ref_phones_per_word]
    word_error = [0] * len(ref_words)
    ref_idx = 0
    for op, r, h in ops:
        if op == 'M':
            ref_idx += 1
        elif op == 'S':
            wi = ref2word[ref_idx]
            word_error[wi] += 1; ref_idx += 1
        elif op == 'D':
            wi = ref2word[ref_idx]
            word_error[wi] += 1; ref_idx += 1
        elif op == 'I':
            # assign insertion to nearest previous word
            wi = max(0, ref2word[ref_idx-1]) if ref_idx > 0 else (ref2word[ref_idx] if ref_idx < len(ref2word) else 0)
            word_error[wi] += 1
    # compute per-word PER and label
    colors = []
    per_word_scores = []
    for i, ref_count in enumerate(word_ref_count):
        per = word_error[i] / ref_count if ref_count > 0 else 0.0
        per_word_scores.append(per)
        if per == 0:
            colors.append(1)  # green
        elif per <= thresholds[1]:
            colors.append(2)  # yellow
        else:
            colors.append(3)  # red
    return colors, per_word_scores


def score_pronunciation(script_text: str, audio_path: str, model_name="mrrubino/wav2vec2-large-xlsr-53-l2-arctic-phoneme", beam_width: int = 50, ignore_stress: bool = True):
    """API-style scoring: input script_text and audio_path, returns dict with per-word labels (1/2/3).

    Steps:
    - get predicted phones from ASR pipeline (assumed to return space-separated phone tokens)
    - get CMUdict pronunciations per word (n-best from CMUdict)
    - fallback to g2p_en for OOV (single candidate)
    - beam over combinations of per-word candidates, rescoring against predicted phones (edit distance)
    - choose best candidate, align to predicted phones, compute per-word PER and labels
    """
    ensure_cmudict()
    from nltk.corpus import cmudict

    # 1) run ASR/phoneme model to get predicted phonemes
    pipe = pipeline(model=model_name)
    result = pipe(audio_path)
    # model may return dict or list; try to extract text
    if isinstance(result, dict):
        ipa_user = result.get('text', '')
    elif isinstance(result, list) and len(result) > 0 and isinstance(result[0], dict):
        ipa_user = result[0].get('text', '')
    else:
        ipa_user = str(result)
    pred_phones = normalize_ipa(ipa_user)

    # 2) prepare per-word candidate IPA lists
    words = [w for w in re.findall(r"\w+", script_text)]
    g2p = G2p()
    per_word_candidates = []
    for w in words:
        w_lower = w.lower()
        candidates = []
        if w_lower in cmudict.dict():
            for arp_list in cmudict.dict()[w_lower]:
                ipa = arpabet_list_to_ipa(arp_list, ignore_stress=ignore_stress)
                candidates.append(ipa)
        # fallback to g2p_en single candidate
        if not candidates:
            raw = g2p(w_lower)
            # extract tokens that look like ARPAbet
            arp = [t for t in raw if re.match(r"^[A-Z]+\d?$", t)]
            if arp:
                candidates.append(arpabet_list_to_ipa(arp, ignore_stress=ignore_stress))
            else:
                candidates.append([w_lower])
        # deduplicate candidate lists (by string)
        seen = set()
        uniq = []
        for c in candidates:
            key = ' '.join(c)
            if key not in seen:
                seen.add(key); uniq.append(c)
        per_word_candidates.append(uniq)

    # 3) beam search over combinations (keep beams small)
    beams = [([], 0.0)]  # (flat_phone_list, score_placeholder)
    for candidates in per_word_candidates:
        new_beams = []
        for seq, _ in beams:
            for cand in candidates:
                new_seq = seq + cand
                # heuristic score: compare to prefix of predicted phones
                prefix = pred_phones[:len(new_seq)]
                hscore = levenshtein(new_seq, prefix)
                new_beams.append((new_seq, hscore))
        # keep top-k beams with smallest heuristic
        new_beams.sort(key=lambda x: x[1])
        beams = new_beams[:beam_width]

    # 4) final rescoring: choose beam with minimal full distance to predicted
    final_scores = [(levenshtein(seq, pred_phones), seq) for seq, _ in beams]
    final_scores.sort(key=lambda x: x[0])
    best_distance, best_seq = final_scores[0]

    # 5) derive per-word ipa_target (from best beam split by original per_word lengths)
    # reconstruct per-word phones by slicing according to candidates chosen: we need to pick which candidate produced best_seq
    # Simple reconstruct: greedily match per_word_candidates to best_seq
    target_per_word = []
    idx = 0
    for candidates in per_word_candidates:
        # choose candidate that matches prefix of best_seq starting at idx
        chosen = None
        for cand in candidates:
            L = len(cand)
            if best_seq[idx:idx+L] == cand:
                chosen = cand; break
        if chosen is None:
            # fallback: pick shortest candidate
            chosen = candidates[0]
        target_per_word.append(chosen)
        idx += len(chosen)

    # 6) compute per-word colors and per-word scores
    colors, per_word_per = word_colors_from_alignment(words, target_per_word, pred_phones)

    # overall score: normalized from best_distance
    total_ref = sum(len(p) for p in target_per_word)
    overall_score = int(max(0, 100 - (best_distance / total_ref * 100))) if total_ref > 0 else 0

    # build errors list from alignment ops for more detail
    flat_ref = [p for phones in target_per_word for p in phones]
    ops = align_with_ops(flat_ref, pred_phones)
    errors = []
    ref_idx = 0
    for op, r, h in ops:
        if op == 'M': ref_idx += 1
        elif op == 'S':
            errors.append({'type': 'sub', 'pos': ref_idx, 'expected': r, 'actual': h}); ref_idx += 1
        elif op == 'D':
            errors.append({'type': 'del', 'pos': ref_idx, 'expected': r, 'actual': None}); ref_idx += 1
        elif op == 'I':
            errors.append({'type': 'ins', 'pos': max(0, ref_idx-1), 'expected': None, 'actual': h})

    return {
        'ipa_user': ' '.join(pred_phones),
        'ipa_target': ' '.join(flat_ref),
        'score': overall_score,
        'words': [
            {'word': w, 'ipa': ' '.join(target_per_word[i]), 'label': colors[i], 'per': per_word_per[i]}
            for i, w in enumerate(words)
        ],
        'errors': errors
    }


if __name__ == '__main__':
    # simple demo (won't run ASR here), show function signature
    print('Module ready: call score_pronunciation(script_text, audio_path)')
