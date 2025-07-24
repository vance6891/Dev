import React from 'react';
import { Container, Typography, Card, CardContent } from '@mui/material';

const Family = () => {
  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom fontWeight="bold">
        Family
      </Typography>
      <Card>
        <CardContent>
          <Typography variant="body1">
            Family page - This will show family members, invite new members, manage permissions, and family settings.
          </Typography>
        </CardContent>
      </Card>
    </Container>
  );
};

export default Family;