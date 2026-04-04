import { useEffect, useId, useMemo, useRef, useState } from 'react';
import '../../styles/shared/filter-dropdown.css';

export type FilterDropdownOption<T extends string = string> = {
  value: T;
  label: string;
};

type FilterDropdownProps<T extends string> = {
  id?: string;
  value: T;
  options: readonly FilterDropdownOption<T>[];
  onChange: (nextValue: T) => void;
  ariaLabel?: string;
  ariaLabelledBy?: string;
  className?: string;
  triggerClassName?: string;
  menuClassName?: string;
  optionClassName?: string;
  disabled?: boolean;
};

const joinClasses = (...classes: Array<string | undefined | false>): string => classes.filter(Boolean).join(' ');

function FilterDropdown<T extends string>({
  id,
  value,
  options,
  onChange,
  ariaLabel,
  ariaLabelledBy,
  className,
  triggerClassName,
  menuClassName,
  optionClassName,
  disabled = false,
}: FilterDropdownProps<T>) {
  const [isOpen, setIsOpen] = useState(false);
  const fallbackTriggerId = useId();
  const menuId = useId();
  const containerRef = useRef<HTMLDivElement | null>(null);
  const optionRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const triggerId = id || fallbackTriggerId;

  const selectedOption = useMemo(
    () => options.find((option) => option.value === value) ?? options[0],
    [options, value],
  );
  const selectedIndex = useMemo(
    () => Math.max(0, options.findIndex((option) => option.value === selectedOption?.value)),
    [options, selectedOption],
  );

  useEffect(() => {
    if (!isOpen) {
      return undefined;
    }

    const handleDocumentClick = (event: MouseEvent) => {
      const target = event.target as Node | null;
      if (containerRef.current && target && !containerRef.current.contains(target)) {
        setIsOpen(false);
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleDocumentClick);
    document.addEventListener('keydown', handleEscape);

    return () => {
      document.removeEventListener('mousedown', handleDocumentClick);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    optionRefs.current[selectedIndex]?.focus();
  }, [isOpen, selectedIndex]);

  const focusOptionAt = (index: number) => {
    const boundedIndex = Math.max(0, Math.min(options.length - 1, index));
    optionRefs.current[boundedIndex]?.focus();
  };

  const handleSelect = (nextValue: T) => {
    onChange(nextValue);
    setIsOpen(false);
  };

  return (
    <div className={joinClasses('dropdown-filter', className)} ref={containerRef}>
      <button
        type="button"
        id={triggerId}
        className={joinClasses('dropdown-filter-trigger', triggerClassName)}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-controls={menuId}
        aria-label={ariaLabel}
        aria-labelledby={ariaLabelledBy}
        disabled={disabled}
        onClick={() => {
          if (!disabled) {
            setIsOpen((current) => !current);
          }
        }}
        onKeyDown={(event) => {
          if (disabled) {
            return;
          }

          if (event.key === 'ArrowDown' || event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            setIsOpen(true);
          }

          if (event.key === 'Escape' || event.key === 'Tab') {
            setIsOpen(false);
          }
        }}
      >
        <span className="dropdown-filter-trigger-label">{selectedOption?.label ?? ''}</span>
        <span className={joinClasses('material-icons', 'dropdown-filter-trigger-icon', isOpen && 'is-open')} aria-hidden="true">expand_more</span>
      </button>

      <div
        id={menuId}
        className={joinClasses('dropdown-filter-menu', isOpen && 'is-open', menuClassName)}
        role="listbox"
        aria-labelledby={ariaLabelledBy || triggerId}
      >
        {options.map((option, index) => {
          const isSelected = option.value === value;

          return (
            <button
              key={option.value}
              ref={(element) => {
                optionRefs.current[index] = element;
              }}
              type="button"
              role="option"
              aria-selected={isSelected}
              className={joinClasses('dropdown-filter-option', isSelected && 'is-selected', optionClassName)}
              onClick={() => handleSelect(option.value)}
              onKeyDown={(event) => {
                if (event.key === 'ArrowDown') {
                  event.preventDefault();
                  focusOptionAt(index + 1);
                }

                if (event.key === 'ArrowUp') {
                  event.preventDefault();
                  focusOptionAt(index - 1);
                }

                if (event.key === 'Home') {
                  event.preventDefault();
                  focusOptionAt(0);
                }

                if (event.key === 'End') {
                  event.preventDefault();
                  focusOptionAt(options.length - 1);
                }

                if (event.key === 'Escape' || event.key === 'Tab') {
                  setIsOpen(false);
                }
              }}
            >
              <span>{option.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default FilterDropdown;