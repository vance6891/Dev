import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Grid,
  Card,
  CardContent,
  Typography,
  Box,
  Button,
  Avatar,
  Chip,
  LinearProgress,
  Fab,
  Alert,
} from '@mui/material';
import {
  Add as AddIcon,
  Baby as BabyIcon,
  AccessTime as TimeIcon,
  Restaurant as FeedIcon,
  Hotel as SleepIcon,
  Baby as DiaperIcon,
  Mood as MoodIcon,
  LocalHospital as HealthIcon,
} from '@mui/icons-material';
import axios from 'axios';
import { format, formatDistanceToNow } from 'date-fns';

const Dashboard = () => {
  const [babies, setBabies] = useState([]);
  const [recentActivities, setRecentActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // Fetch babies
      const babiesResponse = await axios.get('/baby');
      setBabies(babiesResponse.data.babies || []);
      
      // Fetch recent activities for the first baby (if exists)
      if (babiesResponse.data.babies?.length > 0) {
        const babyId = babiesResponse.data.babies[0]._id;
        const activitiesResponse = await axios.get(`/activity/baby/${babyId}?limit=5`);
        setRecentActivities(activitiesResponse.data.activities || []);
      }
      
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      setError('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const getActivityIcon = (type) => {
    const icons = {
      feeding: FeedIcon,
      sleep: SleepIcon,
      diaper: DiaperIcon,
      mood: MoodIcon,
      health: HealthIcon,
    };
    const IconComponent = icons[type] || TimeIcon;
    return <IconComponent />;
  };

  const getActivityColor = (type) => {
    const colors = {
      feeding: 'success',
      sleep: 'primary',
      diaper: 'warning',
      mood: 'info',
      health: 'error',
    };
    return colors[type] || 'default';
  };

  const formatActivityTime = (timestamp) => {
    return formatDistanceToNow(new Date(timestamp), { addSuffix: true });
  };

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <LinearProgress />
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* Welcome Section */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom fontWeight="bold">
          Dashboard
        </Typography>
        <Typography variant="subtitle1" color="text.secondary">
          Welcome back! Here's what's happening with your baby today.
        </Typography>
      </Box>

      <Grid container spacing={3}>
        {/* Babies Overview */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                <Typography variant="h6" fontWeight="bold">
                  Your Babies
                </Typography>
                <Button
                  variant="outlined"
                  startIcon={<AddIcon />}
                  onClick={() => navigate('/baby/add')}
                >
                  Add Baby
                </Button>
              </Box>
              
              {babies.length === 0 ? (
                <Box textAlign="center" py={4}>
                  <BabyIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
                  <Typography variant="h6" color="text.secondary" gutterBottom>
                    No babies added yet
                  </Typography>
                  <Typography variant="body2" color="text.secondary" mb={3}>
                    Start by adding your baby's information to begin tracking their care.
                  </Typography>
                  <Button
                    variant="contained"
                    startIcon={<AddIcon />}
                    onClick={() => navigate('/baby/add')}
                  >
                    Add Your First Baby
                  </Button>
                </Box>
              ) : (
                <Grid container spacing={2}>
                  {babies.map((baby) => (
                    <Grid item xs={12} sm={6} md={4} key={baby._id}>
                      <Card
                        variant="outlined"
                        sx={{
                          cursor: 'pointer',
                          '&:hover': {
                            boxShadow: 2,
                          },
                        }}
                        onClick={() => navigate(`/baby/${baby._id}`)}
                      >
                        <CardContent>
                          <Box display="flex" alignItems="center" mb={2}>
                            <Avatar
                              src={baby.profilePicture}
                              sx={{
                                width: 56,
                                height: 56,
                                mr: 2,
                                bgcolor: 'primary.main',
                              }}
                            >
                              {baby.name[0]}
                            </Avatar>
                            <Box>
                              <Typography variant="h6" fontWeight="bold">
                                {baby.name}
                              </Typography>
                              <Typography variant="body2" color="text.secondary">
                                {baby.age}
                              </Typography>
                            </Box>
                          </Box>
                          <Chip
                            label={baby.gender}
                            size="small"
                            sx={{ textTransform: 'capitalize' }}
                          />
                        </CardContent>
                      </Card>
                    </Grid>
                  ))}
                </Grid>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Quick Actions */}
        {babies.length > 0 && (
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" fontWeight="bold" gutterBottom>
                  Quick Actions
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={6}>
                    <Button
                      fullWidth
                      variant="outlined"
                      startIcon={<FeedIcon />}
                      onClick={() => navigate('/activities/add?type=feeding')}
                      sx={{ mb: 1 }}
                    >
                      Log Feeding
                    </Button>
                  </Grid>
                  <Grid item xs={6}>
                    <Button
                      fullWidth
                      variant="outlined"
                      startIcon={<SleepIcon />}
                      onClick={() => navigate('/activities/add?type=sleep')}
                      sx={{ mb: 1 }}
                    >
                      Log Sleep
                    </Button>
                  </Grid>
                  <Grid item xs={6}>
                    <Button
                      fullWidth
                      variant="outlined"
                      startIcon={<DiaperIcon />}
                      onClick={() => navigate('/activities/add?type=diaper')}
                    >
                      Log Diaper
                    </Button>
                  </Grid>
                  <Grid item xs={6}>
                    <Button
                      fullWidth
                      variant="outlined"
                      startIcon={<MoodIcon />}
                      onClick={() => navigate('/activities/add?type=mood')}
                    >
                      Log Mood
                    </Button>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Grid>
        )}

        {/* Recent Activities */}
        {recentActivities.length > 0 && (
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                  <Typography variant="h6" fontWeight="bold">
                    Recent Activities
                  </Typography>
                  <Button
                    size="small"
                    onClick={() => navigate('/activities')}
                  >
                    View All
                  </Button>
                </Box>
                
                <Box>
                  {recentActivities.map((activity) => (
                    <Box
                      key={activity._id}
                      display="flex"
                      alignItems="center"
                      py={1}
                      borderBottom="1px solid"
                      borderColor="divider"
                      sx={{
                        '&:last-child': {
                          borderBottom: 'none',
                        },
                      }}
                    >
                      <Chip
                        icon={getActivityIcon(activity.type)}
                        label={activity.type}
                        size="small"
                        color={getActivityColor(activity.type)}
                        sx={{ mr: 2, textTransform: 'capitalize' }}
                      />
                      <Box flexGrow={1}>
                        <Typography variant="body2" color="text.secondary">
                          {formatActivityTime(activity.timestamp)}
                        </Typography>
                        {activity.recordedBy && (
                          <Typography variant="caption" color="text.secondary">
                            by {activity.recordedBy.firstName}
                          </Typography>
                        )}
                      </Box>
                    </Box>
                  ))}
                </Box>
              </CardContent>
            </Card>
          </Grid>
        )}

        {/* Today's Summary */}
        {babies.length > 0 && (
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="h6" fontWeight="bold" gutterBottom>
                  Today's Summary
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Detailed activity summary and insights will be displayed here.
                  This section will show feeding frequency, sleep duration, diaper changes, and mood patterns for today.
                </Typography>
                <Box mt={2}>
                  <Button
                    variant="contained"
                    onClick={() => navigate('/activities')}
                  >
                    View Detailed Analytics
                  </Button>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        )}
      </Grid>

      {/* Floating Action Button */}
      {babies.length > 0 && (
        <Fab
          color="primary"
          sx={{
            position: 'fixed',
            bottom: 16,
            right: 16,
          }}
          onClick={() => navigate('/activities/add')}
        >
          <AddIcon />
        </Fab>
      )}
    </Container>
  );
};

export default Dashboard;