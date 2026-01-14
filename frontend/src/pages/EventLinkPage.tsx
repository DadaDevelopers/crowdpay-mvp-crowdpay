import { useParams } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const EventLinkPage = () => {
  const { eventId } = useParams();

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <Card>
        <CardHeader>
          <CardTitle>Event Details</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Event ID: {eventId}
          </p>
          <p className="text-muted-foreground mt-4">
            This page will display event details and payment options.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default EventLinkPage;
