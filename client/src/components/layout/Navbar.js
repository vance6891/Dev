import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  AppBar,
  Toolbar,
  Typography,
  IconButton,
  Menu,
  MenuItem,
  Avatar,
  Box,
  Button,
  Divider,
} from '@mui/material';
import {
  Baby as BabyIcon,
  Dashboard as DashboardIcon,
  Activity as ActivityIcon,
  Calendar as CalendarIcon,
  Family as FamilyIcon,
  Settings as SettingsIcon,
  Logout as LogoutIcon,
  Account as AccountIcon,
} from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';

const Navbar = () => {
  const [anchorEl, setAnchorEl] = useState(null);
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleUserMenuClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleUserMenuClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
    handleUserMenuClose();
  };

  const navigationItems = [
    { path: '/dashboard', label: 'Dashboard', icon: DashboardIcon },
    { path: '/activities', label: 'Activities', icon: ActivityIcon },
    { path: '/calendar', label: 'Calendar', icon: CalendarIcon },
    { path: '/family', label: 'Family', icon: FamilyIcon },
  ];

  const isActive = (path) => location.pathname === path;

  return (
    <AppBar
      position="fixed"
      sx={{
        zIndex: (theme) => theme.zIndex.drawer + 1,
        backgroundColor: 'white',
        color: 'text.primary',
        boxShadow: '0 1px 3px 0 rgb(0 0 0 / 0.1)',
      }}
    >
      <Toolbar>
        {/* Logo */}
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            cursor: 'pointer',
            mr: 4,
          }}
          onClick={() => navigate('/dashboard')}
        >
          <BabyIcon
            sx={{
              fontSize: 32,
              color: 'primary.main',
              mr: 1,
            }}
          />
          <Typography
            variant="h6"
            component="div"
            fontWeight="bold"
            color="primary.main"
          >
            Baby Care
          </Typography>
        </Box>

        {/* Navigation Links */}
        <Box sx={{ display: { xs: 'none', md: 'flex' }, flexGrow: 1 }}>
          {navigationItems.map((item) => {
            const IconComponent = item.icon;
            return (
              <Button
                key={item.path}
                startIcon={<IconComponent />}
                onClick={() => navigate(item.path)}
                sx={{
                  mr: 2,
                  color: isActive(item.path) ? 'primary.main' : 'text.secondary',
                  backgroundColor: isActive(item.path) ? 'primary.light' : 'transparent',
                  '&:hover': {
                    backgroundColor: isActive(item.path) ? 'primary.light' : 'grey.100',
                  },
                }}
              >
                {item.label}
              </Button>
            );
          })}
        </Box>

        {/* User Menu */}
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <IconButton
            onClick={handleUserMenuClick}
            sx={{ p: 0 }}
          >
            <Avatar
              src={user?.profilePicture}
              sx={{
                width: 40,
                height: 40,
                bgcolor: 'primary.main',
              }}
            >
              {user?.firstName?.[0]}{user?.lastName?.[0]}
            </Avatar>
          </IconButton>

          <Menu
            anchorEl={anchorEl}
            open={Boolean(anchorEl)}
            onClose={handleUserMenuClose}
            onClick={handleUserMenuClose}
            transformOrigin={{ horizontal: 'right', vertical: 'top' }}
            anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
            PaperProps={{
              sx: {
                mt: 1,
                minWidth: 200,
              },
            }}
          >
            <Box sx={{ px: 2, py: 1 }}>
              <Typography variant="subtitle2" fontWeight="bold">
                {user?.firstName} {user?.lastName}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {user?.email}
              </Typography>
            </Box>
            
            <Divider />
            
            <MenuItem onClick={() => navigate('/settings')}>
              <SettingsIcon sx={{ mr: 2 }} />
              Settings
            </MenuItem>
            
            <MenuItem onClick={handleLogout}>
              <LogoutIcon sx={{ mr: 2 }} />
              Logout
            </MenuItem>
          </Menu>
        </Box>
      </Toolbar>
    </AppBar>
  );
};

export default Navbar;