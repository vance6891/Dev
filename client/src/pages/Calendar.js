import React from 'react';
import { Container, Typography, Card, CardContent } from '@mui/material';

const Calendar = () => {
  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom fontWeight="bold">
        Calendar
      </Typography>
      <Card>
        <CardContent>
          <Typography variant="body1">
            Calendar page - This will show Google Calendar integration, sync status, and allow users to sync baby activities to their calendar.
          </Typography>
        </CardContent>
      </Card>
    </Container>
  );
};

export default Calendar;