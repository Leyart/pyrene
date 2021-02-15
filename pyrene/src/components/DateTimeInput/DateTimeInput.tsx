import React, { useEffect, useState } from 'react';
import classNames from 'classnames';
import Icon from '../Icon/Icon';
import './dateTimeInput.css';

export interface DateTimeInputProps{
  name?: string,
  timeStamp?: number,
  onChange?: (value: number | null) => void,
}

export type DateType = {
  day: number,
  month: number,
  year: number,
} | undefined;

export type TimeType = {
  minutes: number,
  hours: number,
} | undefined;

const allowedSeparatorCheck = (valueToCheck: string): boolean => (/[/.:]$/.test(valueToCheck));

export const getDateTypeFromddmmyyyyWithSep = (str: string): DateType => {
  if (allowedSeparatorCheck(str.charAt(2)) && allowedSeparatorCheck(str.charAt(5))) {
    return { day: +str.substr(0, 2), month: +str.substr(3, 2), year: +str.substr(6) };
  }
  return undefined;
};

export const getTimeTypeFromhhmmWithSep = (str: string): TimeType => {
  if (allowedSeparatorCheck(str.charAt(2))) {
    return { hours: +str.substr(0, 2), minutes: +str.substr(3) };
  }
  return undefined;
};

export const getTimeStamp = (date: DateType, time: TimeType): number | null => {
  if (time === undefined || date === undefined) {
    return null;
  }

  const timeStamp = new Date(date.year, date.month, date.day, time.hours, time.minutes);
  return timeStamp.valueOf();
};

export const zeroLead = (str: string): string => (str.trim().length < 2 ? `0${str}` : str.trim());

export const standardEUDateformat = (dateStr: DateType): string => {
  if (dateStr !== undefined) {
    const day = zeroLead(dateStr.day.toString());
    const month = zeroLead(dateStr.month.toString());
    const year = dateStr.year.toString();

    return `${day}.${month}.${year}`;
  }
  return '';
};

export const timeformat = (timeStr: TimeType): string => {
  if (timeStr !== undefined) {
    const hours = zeroLead(timeStr.hours.toString());
    const minutes = zeroLead(timeStr.minutes.toString());

    return `${hours}:${minutes}`;
  }
  return '';
};

const DateTimeInput: React.FC<DateTimeInputProps> = ({
  name,
  onChange,
  timeStamp,
}: DateTimeInputProps) => {

  let date: DateType;
  let time: TimeType;

  const [dValue, setDateValue] = useState('');
  const [tValue, setTimeValue] = useState('');

  const dateChecker = () => {
    if (onChange) onChange(null);
  };

  const timeChecker = () => {
    let timestamp = null;
    if (dValue.length === 10 && tValue.length === 5) {
      date = getDateTypeFromddmmyyyyWithSep(dValue);
      time = getTimeTypeFromhhmmWithSep(tValue);

      timestamp = getTimeStamp(date, time);

      if (onChange && timestamp !== null && !Number.isNaN(timestamp)) {
        onChange(timestamp);
      } else if (onChange) onChange(null);
    }
  };

  const defOnChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const node = event.target as HTMLInputElement;

    if (node.className.includes('dateInput')) {
      setDateValue(node.value);
    } else if (node.className.includes('timeInput')) {
      setTimeValue(node.value);
    }
  };

  const setDateTimeFromTimeStamp = (timestamp: number) => {
    const dateObj = new Date(timestamp);

    if (!Number.isNaN(dateObj.valueOf())) {
      // Month shift : JS Date use 0 - 11 to count months
      const theDate: DateType = { day: dateObj.getDate(), month: dateObj.getMonth() + 1, year: dateObj.getFullYear() };

      const theTime: TimeType = { hours: dateObj.getHours(), minutes: dateObj.getMinutes() };
      setDateValue(standardEUDateformat(theDate));
      setTimeValue(timeformat(theTime));
    } else {
      setDateValue('');
      setTimeValue('');
    }
  };

  useEffect(() => {
    if (timeStamp) {
      setDateTimeFromTimeStamp(timeStamp);
    }
  }, [timeStamp]);

  return (
    <div styleName="dateTimeComponent" onBlur={timeChecker}>
      <div styleName="dateTimeFieldTitle">Date &amp; Time</div>
      <div
        styleName="dateTimeInputArea"
      >
        <div styleName={classNames('iconInputContainer', 'calendar')}>
          <Icon type="inline" name="calendar" color="neutral-500" />
          <input
            name={name ? `${name}-date` : ''}
            placeholder="DD.MM.YYYY"
            styleName={classNames('input', 'dateInput')}
            maxLength={10}
            onChange={defOnChange}
            value={dValue}
            onKeyUp={dateChecker}
          />
        </div>
        <div styleName={classNames('iconInputContainer', 'clock')}>
          <Icon type="inline" name="clock" color="neutral-500" />
          <input
            name={name ? `${name}-time` : ''}
            placeholder="HH:MM"
            styleName={classNames('input', 'timeInput')}
            maxLength={5}
            onChange={defOnChange}
            value={tValue}
            onKeyUp={timeChecker}
          />
        </div>

      </div>
    </div>
  );
};

DateTimeInput.displayName = 'DateTime Input';

export default DateTimeInput;
