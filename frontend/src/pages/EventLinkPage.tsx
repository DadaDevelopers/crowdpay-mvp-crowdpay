
import { useParams } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import logo from "@/assets/logo.png";

const EventLinkPage = () => {
  const { eventId } = useParams();

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <div className="flex justify-center mb-6">
        <img src={logo} alt="CrowdPay Logo" className="h-12 w-auto" />
      </div>
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
