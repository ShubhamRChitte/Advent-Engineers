import React from 'react';

/**
 * Auto-selects input text on focus so typing or pressing Backspace/Delete replaces/clears value instantly.
 */
export function handleInputFocus(e: React.FocusEvent<HTMLInputElement>) {
  e.currentTarget.select();
}

/**
 * Universal keyboard navigation & numeric input handler for table cells.
 * - Tab / Enter: Move to next cell (Shift+Tab moves to previous cell).
 * - ArrowUp / ArrowDown: Move to cell above / below in the grid.
 * - ArrowRight / ArrowLeft: Move to next / previous cell (or move cursor inside text).
 * - Backspace / Delete: Deletes character or clears selected cell value.
 */
export function handleTableGridKeyDown(
  e: React.KeyboardEvent<HTMLInputElement>,
  options?: { allowNegative?: boolean; allowDecimal?: boolean }
) {
  const { key, currentTarget: input } = e;

  // 1. Tab & Enter Navigation (Move to next/previous cell in table)
  if (key === 'Tab' || key === 'Enter') {
    const container = input.closest('table, .ae-table-container, form, body') || document;
    const inputs = Array.from(
      container.querySelectorAll<HTMLInputElement>('input:not([disabled]):not([readonly])')
    );
    const currIdx = inputs.indexOf(input);
    if (currIdx !== -1) {
      const direction = e.shiftKey ? -1 : 1;
      const targetInput = inputs[currIdx + direction];
      if (targetInput) {
        e.preventDefault();
        targetInput.focus();
        targetInput.select();
        return;
      }
    }
    return;
  }

  // 2. Arrow Keys Navigation
  if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(key)) {
    const isUp = key === 'ArrowUp';
    const isDown = key === 'ArrowDown';
    const isLeft = key === 'ArrowLeft';
    const isRight = key === 'ArrowRight';

    // Check cursor position for Left and Right to allow normal cursor editing inside input text
    const selectionStart = input.selectionStart;
    const selectionEnd = input.selectionEnd;
    const textLength = input.value.length;
    const isAllSelected = selectionStart === 0 && selectionEnd === textLength;

    if (isLeft && !isAllSelected && selectionStart !== 0) {
      return; // allow normal left movement inside text
    }
    if (isRight && !isAllSelected && selectionEnd !== textLength) {
      return; // allow normal right movement inside text
    }

    const cell = input.closest('td, th');
    const row = input.closest('tr');
    const container = input.closest('table, .ae-table-container, form, body') || document;

    if (!cell || !row) {
      const inputs = Array.from(
        container.querySelectorAll<HTMLInputElement>('input:not([disabled]):not([readonly])')
      );
      const currIdx = inputs.indexOf(input);
      if (currIdx !== -1) {
        let nextInput: HTMLInputElement | null = null;
        if (isDown || isRight) nextInput = inputs[currIdx + 1] || null;
        else if (isUp || isLeft) nextInput = inputs[currIdx - 1] || null;

        if (nextInput) {
          e.preventDefault();
          nextInput.focus();
          nextInput.select();
          return;
        }
      }
      return;
    }

    const cellsInRow = Array.from(row.querySelectorAll('td, th'));
    const colIndex = cellsInRow.indexOf(cell as HTMLElement);

    if (isDown || isUp) {
      e.preventDefault();
      const allRows = Array.from(container.querySelectorAll('tr'));
      const rowIndex = allRows.indexOf(row);
      const direction = isDown ? 1 : -1;
      let targetRowIndex = rowIndex + direction;

      while (targetRowIndex >= 0 && targetRowIndex < allRows.length) {
        const targetRow = allRows[targetRowIndex];
        if (targetRow) {
          const targetCells = Array.from(targetRow.querySelectorAll('td, th'));
          const targetCell = targetCells[colIndex] || targetCells[Math.min(colIndex, targetCells.length - 1)];

          if (targetCell) {
            const targetInput = targetCell.querySelector<HTMLInputElement>(
              'input:not([disabled]):not([readonly])'
            );
            if (targetInput) {
              targetInput.focus();
              targetInput.select();
              return;
            }
          }
        }
        targetRowIndex += direction;
      }
    } else if (isRight || isLeft) {
      const inputs = Array.from(
        container.querySelectorAll<HTMLInputElement>('input:not([disabled]):not([readonly])')
      );
      const currIdx = inputs.indexOf(input);
      if (currIdx !== -1) {
        const targetIdx = isRight ? currIdx + 1 : currIdx - 1;
        const targetInput = inputs[targetIdx];
        if (targetInput) {
          e.preventDefault();
          targetInput.focus();
          targetInput.select();
          return;
        }
      }
    }
    return;
  }

  // 3. Control & Editing Keys Allowed (Backspace, Delete, Escape)
  if (e.ctrlKey || e.metaKey || ['Backspace', 'Delete', 'Escape'].includes(key)) {
    return;
  }

  // 4. Numeric Validation
  const allowDecimal = options?.allowDecimal ?? true;
  const allowNegative = options?.allowNegative ?? true;

  if (allowDecimal && key === '.') return;
  if (allowNegative && (key === '-' || key === '+')) return;

  if (!/^[0-9]$/.test(key)) {
    e.preventDefault();
  }
}
