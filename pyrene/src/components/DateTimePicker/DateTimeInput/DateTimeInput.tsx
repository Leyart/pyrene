import React, { forwardRef, useState } from 'react';
import clsx from 'clsx';

import Icon from '../../Icon/Icon';
import styles from './dateTimeInput.css';

const allowedValueCheck = (valueToCheck:string) : boolean => (/^[0-9.: APM]*$/.test(valueToCheck));

export interface DateTimeInputProps {
  /**
   * Boolean to toggle time display
   */
  dateOnly?: boolean,
  dateValue?: string,
  errorValue?: string,
  handleOn?: (dateString: string, timeString: string) => void
  invalidTimestamp?: boolean,
  label?: string,
  name?: string,
  onChange?: (event: React.ChangeEvent<HTMLInputElement>) => void, // Handle change function passed from react-datepicker
  onClick?: () => void,
  onFocus?: () => void,
  range?: boolean,
  setDateValue?: (value: string) => void,
  setTimeValue?: (value: string) => void,
  tabNum?: number,
  timeValue?: string,
  value?: string
}

const DateTimeInput = forwardRef(({
  dateOnly = false,
  dateValue = '',
  errorValue = '',
  handleOn,
  invalidTimestamp = false,
  label,
  name = '',
  onChange = () => {},
  onClick = () => {},
  onFocus,
  setDateValue = () => {},
  setTimeValue = () => {},
  tabNum,
  timeValue = '',
}:DateTimeInputProps, ref:React.Ref<HTMLInputElement>) => {

  /* const extended = true;
  const extendedDate = () => {
    if (dateOnly) {
      return 10;
    }
    if (extended) {
      return 19;
    }

    return 16;
  };

  const [ampm, setAmPm] = useState(''); */

  const handleDateOnChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const node = event && event.target as HTMLInputElement;

    if (allowedValueCheck(node.value)) {
      if (!dateOnly && node.value.length > 10) {
        setDateValue(node.value.substring(0, 10).trim());
        setTimeValue(node.value.substring(10));

        if (node.value.substring(10).trim().length >= 5) {
          return onChange(event);
        }
      } else {
        setDateValue(node.value);
        setTimeValue('');

        return onChange(event);
      }
    }
    return null;
  };

  const formattedTime = (tvalue: string) => {
    if (!dateOnly) {
      if (tvalue && tvalue !== '' && tvalue.length === 5) {
        if (tvalue.localeCompare('12:00') < 0) {
          return ' AM';
        }
        return ' PM';
      }
    }
    return '';
  };

  const formatTime = (value: string) => {
    if (!dateOnly) {
      if (/\s/g.test(value) || value.length < 5) {
        return value;
      }
      return ` ${value}`;
    }
    return '';
  };

  return (
    <div
      className={styles.dateTimeComponent}
      onKeyUp={() => handleOn?.(dateValue, timeValue.trim())}
    >
      <div className={styles.dateTimeFieldTitle}>{label || (dateOnly ? 'Date' : 'Date & Time')}</div>
      <div className={clsx(styles.dateTimeInputArea, { [styles.dateTimeInputError]: errorValue.length > 0 })}>
        <div className={clsx(styles.iconInputContainer, styles.calendar)}>
          <Icon type="inline" name="calendar" color="neutral-500" />
          <input
            autoComplete="off"
            className={clsx(styles.input, dateOnly ? styles.dateInput : styles.dateTimeInput)}
            disabled={invalidTimestamp}
            name={name ? `${name}_date` : 'date_input'}
            placeholder={dateOnly ? 'DD.MM.YYYY' : 'DD.MM.YYYY HH:MM'}
            maxLength={dateOnly ? 10 : 16}
            ref={ref}
            onClick={onClick}
            onFocus={onFocus}
            onChange={handleDateOnChange}
            tabIndex={tabNum}
            value={`${dateValue}${timeValue && formatTime(timeValue)}`}
          />
        </div>
      </div>
      <div className={styles.dateTimeInputErrorMsg}>
        {errorValue.length > 0 && errorValue}
      </div>
    </div>
  );
});

DateTimeInput.displayName = 'Date Input';

export default DateTimeInput;
