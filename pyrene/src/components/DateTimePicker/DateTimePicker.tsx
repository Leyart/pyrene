import React, {
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react';

import ReactDPWrapper from './ReactDatePickerWrapper/ReactDatePickerWrapper';
import DateTimeInput from './DateTimeInput/DateTimeInput';

import {
  getFutureDate, standardEUDateFormat, standardEUTimeFormat,
  isValidDate, isValidTime, isValidTimeZone, convertToDateTypeObject, convertToTimeTypeObject,
  convertToUTCtime, convertToZoneTime, convertDateTypeToString, convertTimeTypeToString, dateTypeToStandardEUDateFormat,
  getDateTypeFromddmmyyyyWithSep, getTimeTypeFromhhmmWithSep,
} from '../../utils/DateUtils';


type OnFunction = (value?: number | [number, number] | null) => void;

export interface DateTimeInputProps{
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
  name?: string,
  range?: boolean,
  /**
   * This is a unix timestamp, which is the number of seconds that have elapsed since Unix epoch
   */
  timeStamp?: number | [number, number] | null
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

const inRange = (timestampToCheck: number, minimumValue: number, maximumValue: number): number => {
  if (timestampToCheck < minimumValue) {
    return -1;
  }
  if (timestampToCheck > maximumValue) {
    return 1;
  }
  return 0;
};


const DateTimePicker: React.FC<DateTimeInputProps> = ({
  dateOnly = false,
  maxDateTime = getFutureDate({ years: 1 }),
  minDateTime = 0,
  name,
  onBlur,
  onChange,
  range = false,
  timeStamp,
  timeZone = 'Europe/Zurich',
}: DateTimeInputProps) => {

  const compRef = useRef<HTMLDivElement>(null);

  const [internalDate, setInternalDate] = useState<Date | undefined>(undefined);

  const [dateValue, setDateValue] = useState('');
  const [timeValue, setTimeValue] = useState('');


  const [timeZoneValue, setTimeZoneValue] = useState(timeZone);

  const [jsDateObject, setJsDateObject] = useState<Date | undefined>(undefined);

  const [invalidDate, setInvalidDate] = useState(false);
  const [invalidTime, setInvalidTime] = useState(false);
  const [invalidTimestamp, setInvalidTimestamp] = useState(false);
  const [invalidTimeZone, setInvalidTimeZone] = useState(false);

  const [errorValue, setErrorValue] = useState('');

  const handleOn = useCallback((dateString: string, timeString: string, onFunction?: OnFunction) => {
    const isDateLongEnough = dateString.length === 10;
    const isTimeLongEnough = timeString.length === 5;

    if (isDateLongEnough && isTimeLongEnough) {
      const date = getDateTypeFromddmmyyyyWithSep(dateString);
      const time = getTimeTypeFromhhmmWithSep(timeString);

      const validDateState = isValidDate(date);
      const validTimeState = isValidTime(time);
      setInvalidDate(!validDateState);
      setInvalidTime(!validTimeState);

      if (onFunction) {
        if (date && time && validDateState && validTimeState) {
          onFunction(convertToUTCtime(`${convertDateTypeToString(date)} ${convertTimeTypeToString(time)}`, timeZoneValue).valueOf());
        } else {
          onFunction(null);
        }
      }
    } else {
      setInvalidDate(false);
      setInvalidTime(false);
      setJsDateObject(undefined);

      if (onFunction) {
        onFunction(null);
      }
    }
  }, [timeZoneValue]);

  const onChangeReactDP = (date: Date | [Date, Date] | null, event: React.SyntheticEvent<any> | undefined, rangePos?:string): void => {
    console.log(event?.type);
    console.log(date);
    console.log(rangePos);


    if (date && (event?.type === 'click' || (event?.type === 'keydown' && (event as React.KeyboardEvent).key.length > 1))) {
      if (!Array.isArray(date)) {
        if (rangePos === undefined) {
          setDateValue(standardEUDateFormat(date));
          setInternalDate(date);

          if (dateOnly) {
            handleOn(standardEUDateFormat(date), '00:00', onChange);
          } else {
            handleOn(standardEUDateFormat(date), timeValue, onChange);
          }
        }
      }
    } else if (event?.type === 'change') {
      const node = event?.target as HTMLInputElement;
      const isDateLongEnough = node?.value.length >= 10;
      const isTimeLongEnough = node?.value.length >= 16;

      console.log('value ', node?.value.length);

      if (isDateLongEnough) {
        const newdate = getDateTypeFromddmmyyyyWithSep(node?.value.substring(0, 10) || '');
        console.log('Date  : ', newdate);

        if (newdate) {
          setDateValue(dateTypeToStandardEUDateFormat(newdate));
          console.log('Passed Date  : ', convertToUTCtime(convertDateTypeToString(newdate), timeZoneValue));
          setInternalDate(convertToUTCtime(convertDateTypeToString(newdate), timeZoneValue));

          if (dateOnly) {
            handleOn(dateTypeToStandardEUDateFormat(newdate), '00:00', onChange);
          }
        }
      }

      if (!dateOnly && isTimeLongEnough) {
        const newdate = getDateTypeFromddmmyyyyWithSep(node?.value.substring(0, 10) || '');
        const newtime = getTimeTypeFromhhmmWithSep(node?.value.substring(10).trim() || '');

        console.log('Time  : ', newtime);

        if (newdate && newtime) {
          setTimeValue(convertTimeTypeToString(newtime));

          console.log('Entered : ', convertToUTCtime(`${convertDateTypeToString(newdate)} ${convertTimeTypeToString(newtime)}`, timeZoneValue));
          setInternalDate(convertToUTCtime(`${convertDateTypeToString(newdate)} ${convertTimeTypeToString(newtime)}`, timeZoneValue));

          handleOn(dateValue, convertTimeTypeToString(newtime), onChange);
        }

        console.log('Internal : ', internalDate);
      }
    } else if (event === undefined && !Array.isArray(date) && date !== null) { // This is relying on the time click event being 'undefined' temporary fix for access to time value
      console.log(date);
      console.log(rangePos);

      setTimeValue(standardEUTimeFormat(date));
      setDateValue(standardEUDateFormat(date));
      handleOn(standardEUDateFormat(date), standardEUTimeFormat(date), onChange);
    } else {
      setInvalidDate(false);
      setInvalidTime(false);
      setJsDateObject(undefined);
      setInternalDate(undefined);
    }
  };

  useEffect(() => {
    if (jsDateObject) {
      const date = convertToDateTypeObject(jsDateObject);
      const time = convertToTimeTypeObject(jsDateObject);
      const dateString = standardEUDateFormat(jsDateObject);
      const timeString = standardEUTimeFormat(jsDateObject);

      setDateValue(dateString);
      setTimeValue(timeString);

      setInvalidDate(!isValidDate(date));
      setInvalidTime(!isValidTime(time));
    }

    if (invalidTimestamp) {
      setDateValue('');
      setTimeValue('');
      setInvalidDate(false);
      setInvalidTime(false);
    }
  }, [jsDateObject, invalidTimestamp]);

  useEffect(() => {
    if (typeof timeStamp === 'number') {
      const dateObj = new Date(timeStamp);
      if (!Number.isNaN(dateObj.valueOf())) {
        setJsDateObject(convertToZoneTime(timeStamp, timeZoneValue));
        setInvalidTimestamp(false);
      } else {
        setJsDateObject(undefined);
        setInvalidTimestamp(true);
      }
    } else if (typeof timeStamp === 'undefined') {
      setJsDateObject(undefined);
      setInvalidTimestamp(false);

      setDateValue('');
      setTimeValue('');
      setInvalidDate(false);
      setInvalidTime(false);
    }
  }, [timeStamp, timeZoneValue]);

  useEffect(() => {
    if (isValidTimeZone(timeZone)) {
      setTimeZoneValue(timeZone);
      setInvalidTimeZone(false);
    } else {
      setInvalidTimeZone(true);
    }
  }, [timeZone]);

  useEffect(() => {
    const getError = () => {
      if (invalidTimestamp) {
        return 'Invalid timestamp';
      }
      if (invalidDate && invalidTime) {
        return 'Invalid date & time format';
      }
      if (invalidDate) {
        return 'Invalid date format';
      }
      if (invalidTime) {
        return 'Invalid time format';
      }
      if (maxDateTime && jsDateObject) {
        const rangePositon = inRange(jsDateObject.valueOf(), minDateTime, maxDateTime);
        if (rangePositon === -1) {
          return 'Less than minimum date.';
        }
        if (rangePositon === 1) {
          return 'Larger than maximum date.';
        }
      }

      if (invalidTimeZone) {
        const tz = 'Europe/Zurich';
        setTimeZoneValue(tz);
        return `Invalid time zone. ${tz} is being used.`;
      }
      return '';
    };

    setErrorValue(getError());
  }, [invalidDate, invalidTime, invalidTimestamp, invalidTimeZone, jsDateObject, maxDateTime, minDateTime]);

  return (
    <div ref={compRef}>
      <ReactDPWrapper
        onChange={onChangeReactDP}
        endRange={range}
        selectedDate={timeStamp ? jsDateObject : internalDate}
        shouldDisplayTimeColumn={!dateOnly}
        CustomInput={(
          <DateTimeInput
            dateValue={dateValue}
            handleOn={handleOn}
            timeValue={timeValue}
            errorValue={errorValue}
            invalidTimestamp={invalidTimestamp}
            name={name}
            onBlur={onBlur}
            range={false}
            setDateValue={setDateValue}
            setTimeValue={setTimeValue}
            dateOnly={dateOnly}

          />
        )}
      />

    </div>
  );
};

DateTimePicker.displayName = 'DateTime Picker';

export default DateTimePicker;
