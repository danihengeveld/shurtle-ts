import { type LucideIcon } from "lucide-react";
import { type FC } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { format } from "date-fns";

interface StatCardProps {
  title: string;
  icon?: LucideIcon;
  value: string | Date | undefined | null;
  description?: string;
}

const StatCard: FC<StatCardProps> = (props) => {
  let value: string;
  if (typeof props.value === "string") {
    value = props.value;
  } else if (!props.value) {
    value = "-";
  } else {
    value = format(props.value, "dd-MM-yyyy");
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{props.title}</CardTitle>
        {!!props.icon && (
          <props.icon className="h-4 w-4 text-muted-foreground" />
        )}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {!!props.description && (
          <p className="mt-1 text-xs text-muted-foreground">
            {props.description}
          </p>
        )}
      </CardContent>
    </Card>
  );
};

export default StatCard;
