import React, {
  useCallback,
  useEffect,
  useRef,
  useState,
  useReducer,
  ReactNode,
} from 'react';
import Button from '../../Button/Button';
import {
  getFutureDate, standardEUDateFormat, standardEUTimeFormat,
  isValidDate, isValidTime, isValidTimeZone, convertToDateTypeObject,
  convertToUTCtime, convertDateTypeToString, convertTimeTypeToString,
  getDateTypeFromddmmyyyyWithSep, getTimeTypeFromhhmmWithSep,
} from '../../../utils/DateUtils';
import TimeRangeSelector from '../../TimeRangeSelector/TimeRangeSelector';
import RangeDateTimeRangeInput from '../RangeDateTimeInput/RangeDateTimeInput';
import ReactDPWrapper, { CalendarContainer } from '../ReactDatePickerWrapper/ReactDatePickerWrapper';

import styles from './DateTimeRangeSelector.css';
import { dateRangeReducer } from '../DateStateReducer';

type OnFunction = (value?: number | [number, number] | null) => void;
export interface DateTimeRangeProps{
  dateOnly?: boolean,
  /**
   * This is a timestamp that represents the maximum date allowed by the component
   */
  maxDateTime?: number,
  /**
   * This is a timestamp that represents the minimum date allowed by the component
   */
  minDateTime?: number,
  /**
   * Name that can be used to uniquely identify the component
   */
  inline?: boolean,
  /**
   * String labels for the inputs start input, end input
   */
  labels?: [string, string]
  name?: string,
  range?: boolean,
  /**
   * This is a unix timestamp, which is the number of seconds that have elapsed since Unix epoch
   */
  timeStamps?: [number, number],
  /**
   * This is must be a IANA time zone string
   */
  timeZone?: string,
  /**
   * Function to handle onBlur event
   */
  onBlur?: OnFunction,
  /**
   * Function to handle onChange event
   */
  onChange: OnFunction,
}
export interface DateTimeRangeSelectorProps {
  dateOnly?: boolean,
  endDate?: Date,
  endDateValue?: string,
  endTimeValue?: string,
  errorValue?: string,
  handleOn?: (dateString: string, timeString: string, func:(event:any) => void) => void,
  inline?: boolean,
  invalidTimestamp?: boolean,
  maxDate?: Date,
  minDate?: Date,
  name?: string,
  onChange: (date:Date | [Date, Date] | null, event: React.SyntheticEvent<any> | undefined, rangePos?:string) => void
  onBlur?: OnFunction,
  startDate?: Date,
  startDateValue?: string,
  startTimeValue?: string,
  setEndDateValue?: (value: string) => void,
  setEndTimeValue?: (value: string) => void,
  setStartDateValue?: (value: string) => void,
  setStartTimeValue?: (value: string) => void,
  timeZone: string,
}

const DateTimeRangeSelector: React.FC<DateTimeRangeProps> = (({
  dateOnly = false,
  inline = false,
  maxDateTime = getFutureDate({ years: 1 }),
  minDateTime = 0,
  labels = ['From', 'To'],
  name,
  onBlur,
  onChange,
  range = true,
  timeStamps,
  timeZone = 'Europe/Zurich',
}:DateTimeRangeProps) => {

  const focusedInput = useRef('start');
  const rangedRef = useRef<HTMLInputElement>(null);

  const [endDate, setEndDate] = useState<Date | undefined>(undefined);
  const [startDate, setStartDate] = useState<Date | undefined>(undefined);

  const [startDateValue, setStartDateValue] = useState('');
  const [startTimeValue, setStartTimeValue] = useState('');

  const [endDateValue, setEndDateValue] = useState('');
  const [endTimeValue, setEndTimeValue] = useState('');

  const [timeZoneValue, setTimeZoneValue] = useState(timeZone);

  const [internalTimeStamps, setTimestamps] = useState<[number, number] | undefined>(timeStamps);
  const [invalidDate, setInvalidDate] = useState(false);
  const [invalidTime, setInvalidTime] = useState(false);
  const [invalidTimestamp, setInvalidTimestamp] = useState(false);
  const [invalidTimeZone, setInvalidTimeZone] = useState(false);

  const [isCalOpen, setCalOpen] = useState<boolean | undefined>(undefined);

  const [errorValue, setErrorValue] = useState('');


  const [reducer, dispatch] = useReducer(dateRangeReducer, {
    startDate: startDateValue,
    startTime: startTimeValue,
    endDate: endDateValue,
    endTime: endTimeValue,
  });



  const onChangeReactDP = (date: Date | [Date, Date] | null, event: React.SyntheticEvent<any> | undefined, rangePos?:string): void => {
    console.log(event?.type);
    console.log(date);
    console.log('focus :', focusedInput.current);
    console.log('range : ', rangePos);
    console.log(startTimeValue);

    if (event?.type === 'click') {
      if (Array.isArray(date)) {
        const [start, end] = date;

        setStartDate(start);
        setEndDate(end);
      }
    } else if (!Array.isArray(date) && event === undefined) {
      if (date && focusedInput.current === 'start') {
        setStartTimeValue(date ? standardEUTimeFormat(date) : '');
      }

      if (date && focusedInput.current === 'end') {
        setEndTimeValue(date ? standardEUTimeFormat(date) : '');
      }
    }
  };

  useEffect(() => {
    if (startDate) {
      const date = convertToDateTypeObject(startDate);
      const dateString = standardEUDateFormat(startDate);
      const timeString = standardEUTimeFormat(startDate);

      setStartDateValue(dateString);
      setInvalidDate(!isValidDate(date));
    } else {
      setStartDateValue('');
      setStartTimeValue('');

      setInvalidDate(false);
    }
  }, [startDate]);

  useEffect(() => {
    if (endDate) {
      const date = convertToDateTypeObject(endDate);
      const dateString = standardEUDateFormat(endDate);
      const timeString = standardEUTimeFormat(endDate);

      setEndDateValue(dateString);
      setInvalidDate(!isValidDate(date));
    } else {
      setEndDateValue('');
      setEndTimeValue('');

      setInvalidDate(false);
      setInvalidTime(false);
    }
  }, [endDate]);



  useEffect(() => {
    if (invalidTimestamp) {
      setStartDateValue('');
      setStartTimeValue('');

      setEndDateValue('');
      setEndTimeValue('');


      setInvalidDate(false);
      setInvalidTime(false);
    }
  }, [invalidTimestamp]);



  useEffect(() => {
    if (startTimeValue) {
      setStartTimeValue(startTimeValue);
      setInvalidTime(!isValidTime(getTimeTypeFromhhmmWithSep(startTimeValue)));
    }
  }, [startTimeValue]);

  useEffect(() => {
    if (endTimeValue) {
      setEndTimeValue(endTimeValue);
      setInvalidTime(!isValidTime(getTimeTypeFromhhmmWithSep(endTimeValue)));
    }
  }, [endTimeValue]);

  useEffect(() => {
    if (isValidTimeZone(timeZone)) {
      setTimeZoneValue(timeZone);
      setInvalidTimeZone(false);
    } else {
      setInvalidTimeZone(true);
    }
  }, [timeZone]);

  useEffect(() => {
    console.log(reducer.range);
    if (Array.isArray(reducer.range)) {
      const startDateObj = new Date(reducer.range[0]);
      const endDateObj = new Date(reducer.range[1]);

      if (!Number.isNaN(startDateObj.valueOf())) {
        const date = convertToDateTypeObject(startDateObj);
        const dateString = standardEUDateFormat(startDateObj);
        const timeString = standardEUTimeFormat(startDateObj);

        setStartDate(startDateObj);
        setStartTimeValue(timeString);
        // setInvalidDate(!isValidDate(date));
      } else {
        // setInvalidStartTimestamp(true);
      }

      if (!Number.isNaN(endDateObj.valueOf())) {
        const date = convertToDateTypeObject(endDateObj);
        const dateString = standardEUDateFormat(endDateObj);
        const timeString = standardEUTimeFormat(endDateObj);

        setEndDate(endDateObj);
        setEndTimeValue(timeString);

        // setInvalidDate(!isValidDate(date));
      } else {
        // setInvalidEndTimestamp(true);
      }

      if (reducer.range && (typeof reducer.range[0] === 'undefined')) {
        setStartDateValue('');
        setStartTimeValue('');
        // setInvalidStartTimestamp(false);
      }

      if (reducer.range && (typeof reducer.range[1] === 'undefined')) {
        setEndDateValue('');
        setEndTimeValue('');
        // setInvalidEndTimestamp(false);
      }
    }
  }, [reducer.range, timeZoneValue]);


  useEffect(() => {
    console.log('Lalala ', rangedRef);
  }, [rangedRef, timeZoneValue]);

  const handleApplyButton = () => {
    onChange(reducer.range);
  };

  const handleDiscardButton = () => {
    setCalOpen(!isCalOpen);
  };

  const handleFocus = (e:string) => {
    focusedInput.current = e;
    console.log(e);
  };


  const customCalendar = (props:{
    children: ReactNode[]
  }) => {
    const { children } = props;
    return (
      <>
        <RangeDateTimeRangeInput
          startDateValue={startDateValue}
          startTimeValue={startTimeValue}
          endDateValue={endDateValue}
          endTimeValue={endTimeValue}
          labels={labels}
          onFocus={handleFocus}
          parentDispatch={dispatch}
        />
        <CalendarContainer>
          <div ref={rangedRef}>{children}</div>
        </CalendarContainer>
        <div className={styles.rangeFooter}>
          <div className={styles.infoBox}>
            {errorValue || `Max. past date: ${standardEUDateFormat(new Date(minDateTime))} `}
          </div>
          <div className={styles.footerButtonsBox}>
            <Button label="Discard" type="secondary" onClick={handleDiscardButton} />
            <Button label="Apply" onClick={handleApplyButton} />
          </div>
        </div>
      </>
    );
  };


  return (
    <>
      <ReactDPWrapper
        closeOnSelect={false}
        customCalendar={customCalendar}
        endDate={reducer.range ? convertToUTCtime(reducer.range[1], timeZoneValue) : endDate}
        onChange={(date, event) => onChangeReactDP(date, event, focusedInput.current)}
        selectedDate={reducer.range ? convertToUTCtime(reducer.range[0], timeZoneValue) : startDate}
        shouldDisplayTimeColumn={!dateOnly}
        startDate={reducer.range ? convertToUTCtime(reducer.range[0], timeZoneValue) : startDate}
        range={range}
        CustomInput={!inline && (
          <TimeRangeSelector
            timezone="Europe/Zurich"
            from={convertToUTCtime(reducer.range?.[0] || (new Date()).valueOf(), timeZoneValue).valueOf()}
            to={convertToUTCtime(reducer.range?.[1] || getFutureDate({ months: 4 }), timeZoneValue).valueOf()}
            lowerBound={minDateTime}
            upperBound={maxDateTime}
            onChange={(from: number, to: number) => { console.log(from, to); }}
          />
        )}
        inline={inline}
        isOpen={isCalOpen}
        maxDate={convertToUTCtime(maxDateTime, timeZoneValue)}
        minDate={convertToUTCtime(minDateTime, timeZoneValue)}
        openDate={reducer.range ? convertToUTCtime(reducer.range[0], timeZoneValue) : startDate}
        // value={`${startDateValue}`}
      />
    </>
  );
});

DateTimeRangeSelector.displayName = 'Time Range Selector';
export default DateTimeRangeSelector;
