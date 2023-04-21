import { format, parseISO } from "date-fns";
import { type FC } from "react";

interface DateProps {
  date: Date | string | undefined | null;
}

const Date: FC<DateProps> = ({ date: maybeDate }) => {
  let date: Date | undefined = undefined;
  if (typeof maybeDate === "string") {
    date = parseISO(maybeDate);
  } else if (!maybeDate) {
    return <p>-</p>
  } else {
    date = maybeDate;
  }

  return (
    <time dateTime={date.toDateString()}>{format(date, "dd-MM-yyyy")}</time>
  );
};

export default Date;
