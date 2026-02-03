// src/utils/textUtils.ts

export const STOP_WORDS = new Set([
    "a", "an", "the",
    "is", "am", "are", "was", "were", "be", "been", "being",
    "in", "on", "at", "to", "for", "of", "with", "by", "from",
    "and", "or", "but", "so", "if", "then",
    "it", "this", "that", "there", "here",
    "he", "she", "they", "we", "i", "you", "me", "him", "her", "us", "them",
    "my", "your", "his", "its", "our", "their",
    "do", "does", "did", "done",
    "has", "have", "had",
    "would", "should", "could", "will", "can", "may", "might", "must"
]);

/**
 * Removes punctuation and converts to lowercase for consistent comparison.
 * Example: "Hello?" -> "hello"
 */
export const cleanWord = (word: string): string => {
    return word.toLowerCase().replace(/[^a-z0-9]/g, "");
};

/**
 * Determines if a word should be ignored/skipped in ASL playback and statistics.
 * @param word The word to check
 * @returns true if the word is a stop word
 */
export const shouldIgnoreWord = (word: string): boolean => {
    return STOP_WORDS.has(cleanWord(word));
};
