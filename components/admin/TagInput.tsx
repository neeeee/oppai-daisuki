"use client";

import React, { useState, KeyboardEvent, useRef } from "react";

interface TagInputProps {
  tags: string[];
  onChange: (tags: string[]) => void;
  placeholder?: string;
  className?: string;
  label?: string;
}

export default function TagInput({
  tags,
  onChange,
  placeholder = "Type tags and press Enter or comma to add",
  className = "",
  label = "Tags",
}: TagInputProps) {
  const [inputValue, setInputValue] = useState("");
  const [isInputFocused, setIsInputFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Add tag function
  const addTag = (tagText: string) => {
    const trimmedTag = tagText.trim();
    if (trimmedTag && !tags.includes(trimmedTag)) {
      onChange([...tags, trimmedTag]);
    }
  };

  // Remove tag function
  const removeTag = (indexToRemove: number) => {
    onChange(tags.filter((_, index) => index !== indexToRemove));
  };

  // Handle key press events
  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    const value = inputValue.trim();

    if (e.key === "Enter" && value) {
      e.preventDefault();
      addTag(value);
      setInputValue("");
    } else if (e.key === "Backspace" && !inputValue && tags.length > 0) {
      // Remove last tag if input is empty and backspace is pressed
      removeTag(tags.length - 1);
    } else if (e.key === "Escape") {
      inputRef.current?.blur();
    }
  };

  // Handle input change
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;

    // Check if a comma was just typed
    if (value.endsWith(",")) {
      const tagToAdd = value.slice(0, -1).trim();
      if (tagToAdd) {
        addTag(tagToAdd);
        setInputValue("");
      }
    } else {
      setInputValue(value);
    }
  };

  // Handle blur - add any remaining text as a tag
  const handleBlur = () => {
    setIsInputFocused(false);
    const value = inputValue.trim();
    if (value) {
      addTag(value);
      setInputValue("");
    }
  };

  // Handle focus
  const handleFocus = () => {
    setIsInputFocused(true);
  };

  // Handle clicking on the container to focus input
  const handleContainerClick = () => {
    inputRef.current?.focus();
  };

  return (
    <div className={`space-y-2 ${className}`}>
      {label && (
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          {label}
        </label>
      )}

      {/* Tag container */}
      <div
        onClick={handleContainerClick}
        className={`
          min-h-[42px] w-full rounded-md border px-3 py-2 cursor-text bg-white dark:bg-gray-700 transition-colors
          ${
            isInputFocused
              ? "border-indigo-500 ring-1 ring-indigo-500"
              : "border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500"
          }
          ${tags.length > 0 ? "flex flex-wrap items-center gap-2" : "flex items-center"}
        `}
      >
        {/* Display existing tags */}
        {tags.map((tag, index) => (
          <span
            key={index}
            className="inline-flex items-center gap-1 px-2 py-1 text-sm bg-indigo-100 dark:bg-indigo-900/50 text-indigo-800 dark:text-indigo-200 rounded-md"
          >
            {tag}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                removeTag(index);
              }}
              className="flex-shrink-0 ml-1 text-indigo-600 dark:text-indigo-300 hover:text-indigo-800 dark:hover:text-indigo-100 focus:outline-none"
              aria-label={`Remove tag: ${tag}`}
            >
              <svg
                className="w-3 h-3"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </span>
        ))}

        {/* Input field */}
        <input
          ref={inputRef}
          type="text"
          value={inputValue}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={handleFocus}
          onBlur={handleBlur}
          placeholder={tags.length === 0 ? placeholder : ""}
          className="flex-1 min-w-[120px] bg-transparent border-none outline-none placeholder-gray-400 dark:placeholder-gray-500 text-gray-900 dark:text-white"
        />
      </div>

      {/* Helper text */}
      <p className="text-xs text-gray-500 dark:text-gray-400">
        Type and press Enter or comma to add tags. Click × to remove. Backspace
        to remove last tag.
      </p>
    </div>
  );
}
