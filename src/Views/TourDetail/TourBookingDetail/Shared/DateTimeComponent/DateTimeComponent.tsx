import { useEffect, useState } from 'react';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { useParams } from 'react-router-dom';
import { format, parse } from 'date-fns';
import { useGetDateAndTimeQuery } from '../../../../../Services/Api/module/demoApi';
import Select from 'react-select';
import './DateTimeBooking.css';

interface DateTimeComponentProps {
  readonly sendDateTime: (dateTime: [string | null, string | null]) => void;
  readonly selectedCalendarDate: string;
  readonly id: string;
}

function DateTimeComponent({ sendDateTime, selectedCalendarDate, id }: DateTimeComponentProps) {
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const { slugId } = useParams();
  const slugValue = slugId;

  const {
    data: res,
    isFetching,
    isLoading,
  } = useGetDateAndTimeQuery(
    { slugValue, date: selectedDate },
    { skip: !selectedDate }
  );

  const availableTimes: string[] =
    res?.data?.map((item: { start: string }) => {
      const time24 = item?.start?.slice(11, 16);
      const parsedTime = parse(time24, 'HH:mm', new Date());
      return format(parsedTime, 'hh:mm a');
    }) || [];

  useEffect(() => {
    setSelectedDate(selectedCalendarDate);
  }, [selectedCalendarDate]);

  function handleDateChange(date: any) {
    const formattedDate = date ? format(date, 'yyyy-MM-dd') : null;
    setSelectedDate(formattedDate);
    setSelectedTime(null);
    sendDateTime([formattedDate, null]);
  }

  function handleTimeChange(selectedOption: { value: string; label: string } | null) {
    const newTime = selectedOption ? selectedOption.value : null;
    setSelectedTime(newTime);
    if (selectedDate && newTime) {
      sendDateTime([selectedDate, newTime]);
    }
  }

  let timeContent;

  if (isLoading || isFetching) {
    timeContent = <p className="available-time-loading">Loading available time slots...</p>;
  } else if (availableTimes.length === 0) {
    timeContent = <p className="available-time-loading no-time-available">No time slots available for this date.</p>;
  } else {
    const timeOptions = availableTimes.map((timeSlot) => ({
      value: timeSlot,
      label: timeSlot,
    }));

    timeContent = (
      <Select
        classNamePrefix="react-select"
        className="react-select-container"
        placeholder="choose time"
        value={selectedTime ? { value: selectedTime, label: selectedTime } : null}
        onChange={handleTimeChange}
        options={timeOptions}
        isSearchable={false}
        styles={{
    control: (base, state) => ({
      ...base,
      borderColor: state.isFocused ? 'black' : base.borderColor,
      boxShadow: state.isFocused ? '0 0 0 1px black' : base.boxShadow,
      '&:hover': {
        borderColor: state.isFocused ? 'black' : base.borderColor,
      },
    }),
  }}
      />
    );
  }

  return (
    <div className="bookNow-date-time-container">
      <DatePicker
        id={id}
        className="book-now-date-time"
        selected={selectedDate ? new Date(selectedDate) : null}
        onChange={handleDateChange}
        minDate={new Date()}
        maxDate={new Date(new Date().getFullYear(), 11, 31)}
        dateFormat="yyyy-MM-dd"
        placeholderText="Choose date"
        showMonthDropdown
        dropdownMode="select"
        showYearDropdown={false}
        onKeyDown={(e) => {
          const allowedKeys = ['Tab', 'Enter', 'Escape'];
          if (!allowedKeys.includes(e.key)) {
            e.preventDefault();
          }
        }}
      />
      <br />
      <br />
      <span className="book-now-minor-heading">Time</span>
      <br />
      {timeContent}
    </div>
  );
}

export default DateTimeComponent;
