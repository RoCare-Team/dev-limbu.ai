'use client';
import * as React from 'react';
import { styled, useTheme } from '@mui/material/styles';
import {
  Box,
  CssBaseline,
  Drawer as MuiDrawer,
  AppBar as MuiAppBar,
  Toolbar,
  Typography,
  Divider,
  IconButton,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Avatar,
  Badge,
  Chip,
  useMediaQuery,
  Menu,
  MenuItem,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Grid,
  Card,
  CardContent,
  Tabs,
  Tab,
  CircularProgress,
  ToggleButton,
  ToggleButtonGroup
} from '@mui/material';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import {
  ChevronLeft as ChevronLeftIcon,
  ChevronRight as ChevronRightIcon,
  Dashboard as DashboardIcon,
  AccountCircle as AccountIcon,
  Article as PostIcon,
  Settings as SettingsIcon,
  Logout as LogoutIcon,
  Upgrade as UpgradeIcon,
  KeyboardArrowDown as ArrowDownIcon,
  AccountBalanceWallet as WalletIcon,
} from '@mui/icons-material';
import { useRouter, usePathname } from 'next/navigation';
import toast, { Toaster } from 'react-hot-toast';
import Link from 'next/link';
import { Activity, Home, Menu as MenuIcon, Package, Wand, CheckCircle, X, LayoutDashboard, FileText, Star, Image as LucideImage, KeyRound, History, ChevronDown, ChevronUp, User, Sparkles } from 'lucide-react';
import logoDash from "../../public/images/bg-logo.png"
import Image from 'next/image';
import WebAssetIcon from '@mui/icons-material/WebAsset';
import { CassetteTape } from 'lucide-react';

const drawerWidth = 260;

/** Only these localStorage `userId` values see Settings in the sidebar / account menu. */
const SETTINGS_NAV_USER_IDS = new Set(['USR1761994068831']);

const openedMixin = (theme) => ({
  width: drawerWidth,
  background: '#ffffff',
  borderRight: '1px solid #f1f5f9',
  transition: theme.transitions.create('width', {
    easing: theme.transitions.easing.sharp,
    duration: theme.transitions.duration.enteringScreen,
  }),
  overflowX: 'hidden',
});

const closedMixin = (theme) => ({
  transition: theme.transitions.create('width', {
    easing: theme.transitions.easing.sharp,
    duration: theme.transitions.duration.leavingScreen,
  }),
  overflowX: 'hidden',
  width: 0,
  [theme.breakpoints.up('sm')]: {
    width: 72,
  },
  background: '#ffffff',
  borderRight: '1px solid #f1f5f9',
});

const DrawerHeader = styled('div')(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  padding: theme.spacing(0, 2),
  minHeight: 64,
}));

const AppBar = styled(MuiAppBar, {
  shouldForwardProp: (prop) => prop !== 'open',
})(({ theme, open }) => ({
  zIndex: theme.zIndex.drawer + 1,
  background: '#ffffff',
  boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.05), 0 1px 2px 0 rgba(0, 0, 0, 0.03)',
  color: '#333',
  transition: theme.transitions.create(['width', 'margin'], {
    easing: theme.transitions.easing.sharp,
    duration: theme.transitions.duration.leavingScreen,
  }),
  ...(open && {
    marginLeft: drawerWidth,
    width: `calc(100% - ${drawerWidth}px)`,
    [theme.breakpoints.down('sm')]: {
      marginLeft: 0,
      width: '100%',
    },
  }),
}));

const Drawer = styled(MuiDrawer, { shouldForwardProp: (prop) => prop !== 'open' })(
  ({ theme, open }) => ({
    width: drawerWidth,
    flexShrink: 0,
    whiteSpace: 'nowrap',
    boxSizing: 'border-box',
    ...(open && {
      ...openedMixin(theme),
      '& .MuiDrawer-paper': openedMixin(theme),
    }),
    ...(!open && {
      ...closedMixin(theme),
      '& .MuiDrawer-paper': closedMixin(theme),
    }),
  })
);


export default function Sidebar({ children, user }) {
  const theme = useTheme();
  const router = useRouter();
  const pathname = usePathname();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [open, setOpen] = React.useState(!isMobile);
  const [userPlan, setUserPlan] = React.useState('Free');
  const [walletBalance, setWalletBalance] = React.useState(0);
  const [anchorEl, setAnchorEl] = React.useState(null);
  const [upgradeDialogOpen, setUpgradeDialogOpen] = React.useState(false);
  const [userId, setUserId] = React.useState(null);
  const [subscriptionData, setSubscriptionData] = React.useState(null);
  const [subscriptionLoading, setSubscriptionLoading] = React.useState(true);
  const [userName, setUserName] = React.useState('');
  const [userEmail, setUserEmail] = React.useState('');
  const [initialLoad, setInitialLoad] = React.useState(true);
  const [locationCheck, setLocationCheck] = React.useState("")
  const [openDropdown, setOpenDropdown] = React.useState(null);
  const [paidService, setPaidService] = React.useState(null);
  const [paidPackage, setPaidPackage] = React.useState(null);
  const [currentPlanDuration, setCurrentPlanDuration] = React.useState(null);
  const [plansModalOpen, setPlansModalOpen] = React.useState(false);
  const [subscriptionPlans, setSubscriptionPlans] = React.useState(null);
  const [servicePlans, setServicePlans] = React.useState([]);
  // const [subscriptionPlans, setSubscriptionPlans] = React.useState(null);
  const [plansLoading, setPlansLoading] = React.useState(false);
  const [activeTab, setActiveTab] = React.useState(0);
  const [selectedCycle, setSelectedCycle] = React.useState('monthly');


  const [notifications, setNotifications] = React.useState([]);
  const [notificationCount, setNotificationCount] = React.useState(0);
  const [notifAnchorEl, setNotifAnchorEl] = React.useState(null); // renamed ✅

  // Sync userId from localStorage for nav (e.g. Settings visibility).
  React.useLayoutEffect(() => {
    if (typeof window === 'undefined') return;
    const id = localStorage.getItem('userId');
    if (id) setUserId(id);
  }, []);

  React.useEffect(() => {
    if (typeof window === 'undefined') return undefined;
    const onStorage = (e) => {
      if (e.key === 'userId') setUserId(e.newValue || null);
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  React.useEffect(() => {
    if (typeof window === 'undefined') return;
    const id = localStorage.getItem('userId');
    setUserId(id || null);
  }, [pathname]);

  // Get user info from props or localStorage
  React.useEffect(() => {
    if (user?.name) {
      setUserName(user.name);
    } else if (typeof window !== 'undefined') {
      const storedName = localStorage.getItem('userName') || localStorage.getItem('fullName');
      if (storedName) {
        setUserName(storedName);
      }
    }

    if (user?.email) {
      setUserEmail(user.email);
    } else if (typeof window !== 'undefined') {
      const storedEmail = localStorage.getItem('userEmail') || localStorage.getItem('email');
      if (storedEmail) {
        setUserEmail(storedEmail);
      }
    }
  }, [user]);

  // Fetch user subscription details from API
  const fetchSubscriptionDetails = async (showLoader = false) => {
    if (showLoader) {
      setSubscriptionLoading(true);
    }

    try {
      const storedUserId = localStorage.getItem('userId');
      if (!storedUserId) {
        console.error('No userId found');
        setUserPlan('Free');
        return;
      }

      const response = await fetch(`/api/auth/signup?userId=${storedUserId}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });

      if (response.ok) {
        const data = await response.json();
        setSubscriptionData(data);

        console.log("dataata",data);
        

        // Extract user name correctly
        if (data.fullName) {
          setUserName(data.fullName);
          localStorage.setItem('userName', data.fullName);
        }

        if (data.email) {
          setUserEmail(data.email);
          localStorage.setItem('userEmail', data.email);
        }

        // Check subscription status
        if (data.subscription && data.subscription.status === 'active') {
          const newPlan = data.subscription.plan || 'Premium Plan';
          setUserPlan(newPlan);
          localStorage.setItem('Plan', newPlan);
        } else {
          setUserPlan('Free');
          localStorage.setItem('Plan', 'Free');
        }
        
        if (data.paidService) {
          setPaidService(data.paidService);
          localStorage.setItem('paidService', data.paidService);
        }

        if (data.paidPackage) {
          setPaidPackage(data.paidPackage);
          localStorage.setItem('paidPackage', data.paidPackage);
        }

        if (data.planDuration) {
          setCurrentPlanDuration(data.planDuration);
          localStorage.setItem('planDuration', data.planDuration);
        }

        // Update wallet balance from subscription data
        if (data.wallet !== undefined) {
          setWalletBalance(data.wallet);
          localStorage.setItem('walletBalance', data.wallet.toString());
        }
      } else {
        setUserPlan('Free');
        localStorage.setItem('Plan', 'Free');
      }
    } catch (error) {
      console.error('Error fetching subscription details:', error);
      setUserPlan('Free');
      localStorage.setItem('Plan', 'Free');
    } finally {
      if (showLoader) {
        setSubscriptionLoading(false);
      }
      setInitialLoad(false);
    }
  };



  // Fetch wallet balance from API
  const fetchWalletBalance = async () => {
    try {
      const storedUserId = localStorage.getItem('userId');
      if (!storedUserId) {
        console.error('No userId found');
        return;
      }

      const response = await fetch(`/api/users/userbalance?userId=${storedUserId}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });

      if (response.ok) {
        const data = await response.json();
        setWalletBalance(data.user.wallet);
        localStorage.setItem('walletBalance', data.user.wallet.toString());
      }
    } catch (error) {
      console.error('Error fetching wallet balance:', error);
    }
  };

  // Get plan and wallet from localStorage and API on mount
  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      const storedUserId = localStorage.getItem('userId');
      if (storedUserId) {
        setUserId(storedUserId);

        // Load from localStorage first for instant display
        const storedPlan = localStorage.getItem('Plan');
        if (storedPlan) {
          setUserPlan(storedPlan);
        }

        const storedBalance = localStorage.getItem('walletBalance');
        if (storedBalance) {
          setWalletBalance(parseInt(storedBalance));
        }

        const storedName = localStorage.getItem('userName') || localStorage.getItem('fullName');
        if (storedName) {
          setUserName(storedName);
        }

        const storedEmail = localStorage.getItem('userEmail') || localStorage.getItem('email');
        if (storedEmail) {
          setUserEmail(storedEmail);
        }
        
        const storedPaidService = localStorage.getItem('paidService');
        if (storedPaidService) {
          setPaidService(storedPaidService);
        }
        
        const storedPaidPackage = localStorage.getItem('paidPackage');
        if (storedPaidPackage) {
          setPaidPackage(storedPaidPackage);
        }

        const storedPlanDuration = localStorage.getItem('planDuration');
        if (storedPlanDuration) {
          setCurrentPlanDuration(storedPlanDuration);
        }

        // Then fetch latest data
        fetchSubscriptionDetails(true);
        fetchWalletBalance();
      } else {
        setSubscriptionLoading(false);
        setInitialLoad(false);
      }
    }
  }, []);

  const fetchPlansData = async () => {
    try {
      const res = await fetch('/api/home-data?type=subscriptionPlans');
      if (res.ok) {
        const data = await res.json();
        setSubscriptionPlans(data);
      }
    } catch (error) {
      console.error("Failed to fetch plans", error);
    }
  };

  const handleOpenPlansModal = () => {
    setPlansModalOpen(true);
    fetchSubscriptionDetails(false);
    fetchPlansData();
  };

  const handleClosePlansModal = () => {
    setPlansModalOpen(false);
  };

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  const handleCycleChange = (event, newCycle) => {
    if (newCycle !== null) {
      setSelectedCycle(newCycle);
    }
  };

  // Refresh wallet balance and subscription periodically (only wallet, not plan)
  React.useEffect(() => {
    if (userId) {
      const interval = setInterval(() => {
        fetchWalletBalance();
      }, 30000); // Only refresh wallet every 30 seconds

      return () => clearInterval(interval);
    }
  }, [userId]);

  React.useEffect(() => {
    if (isMobile) {
      setOpen(false);
    }
  }, [isMobile]);

  const handleDrawerToggle = () => setOpen(!open);

  const handleMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  // const handleUpgradeClick = () => {
  //   if (userPlan === 'Free' || subscriptionData?.subscription?.status !== 'active') {
  //     handleMenuClose();
  //     router.push('/subscription');
  //   } else {
  //     // Refresh subscription data before opening dialog
  //     fetchSubscriptionDetails(true);
  //     setUpgradeDialogOpen(true);
  //     handleMenuClose();
  //   }
  // };

  // const handleUpgradeDialogClose = () => {
  //   setUpgradeDialogOpen(false);
  // };

  const handleWalletClick = () => {
    if (userId) {
      fetchWalletBalance();
    }
    handleMenuClose();
    router.push('/wallet');
  };

  const handleSignOut = async () => {
    try {
      if (typeof window !== 'undefined') {
        localStorage.clear();
      }
      toast.success('Logged out successfully!');
      router.push('/login');
    } catch (error) {
      console.error('Logout error:', error);
      toast.error('Failed to logout. Please try again.');
    }
  };



  const fetchNotifications = async () => {
    try {
      const res = await fetch("/api/admin/notification");
      const data = await res.json();

      if (data.success && data.notifications) {
        setNotifications(data.notifications);
        const unread = data.notifications.filter((n) => !n.isRead).length;
        setNotificationCount(unread);
      }
    } catch (err) {
      console.error("Error fetching notifications:", err);
    }
  };

  React.useEffect(() => {
    fetchNotifications();
    const locationDetailsStr = localStorage.getItem("locationDetails");

    const locationDetails = JSON.parse(locationDetailsStr);



    const bussinessLocation = locationDetails && locationDetails[0]?.title;
    setLocationCheck(bussinessLocation)
  }, []);

  // ✅ Handle open/close
  const handleNotifOpen = (event) => setNotifAnchorEl(event.currentTarget);
  const handleNotifClose = () => setNotifAnchorEl(null);

  const menuItems = [
    { text: 'Home', icon: <Home size={20} />, path: '/' },
    { text: 'Dashboard', icon: <LayoutDashboard size={20} />, path: '/dashboard' },
    { text: 'Post Management', icon: <FileText size={20} />, path: '/post-management' },
    { text: 'Review Management', icon: <Star size={20} />, path: '/review-management' },
    {
      text: 'Get Magic QR',
      icon: <Wand size={20} />,
      children: [
        { text: 'Get Magic QR', path: '/get-magic-qr' },
        { text: 'Get Customer Review', path: '/reviews/get-customer-review' }
      ]
    },
    { text: 'Assets Management', icon: <LucideImage size={20} />, path: '/assets-management' },
    { text: 'Keyword Management', icon: <KeyRound size={20} />, path: '/keyword-planner' },
    {
      text: 'Services & Packages',
      icon: <Package size={20} />,
      children: [
        { text: 'Our Services', path: '/#services' },
        { text: 'Our Packages', path: '/#subscription-plans' }
      ]
    },
    { text: 'GMB Health', icon: <Activity size={20} />, path: '/gmb-health' },
    // { text: 'Build Website', icon: <Activity size={20} />, path: '/build-website' },
    // { text: 'User Activity', icon: <History size={20} />, path: '/user-activity' },
    { text: 'User Profile', icon: <User size={20} />, path: '/profile' },
    // { text: 'Optimization', icon: <Sparkles size={20} />, path: '/user-settings/optimization' },
    { text: 'Settings', icon: <SettingsIcon size={20} />, path: '/user-settings' },
  ];

  const SETTINGS_RELATED_PATHS = new Set(['/user-settings', '/user-settings/optimization']);
  const navUserId = typeof userId === 'string' ? userId.trim() : '';
  const showSettingsNav = SETTINGS_NAV_USER_IDS.has(navUserId);
  const visibleMenuItems = showSettingsNav
    ? menuItems
    : menuItems.filter((item) => !SETTINGS_RELATED_PATHS.has(item.path));

  // const getPlanConfig = (plan) => {
  //   const planLower = plan?.toLowerCase() || 'free';

  //   switch (planLower) {
  //     case 'premium':
  //     case 'premium plan':
  //     case 'pro':
  //       return {
  //         label: 'Premium',
  //         gradient: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
  //         color: 'white',
  //       };
  //     case 'enterprise':
  //     case 'enterprise plan':
  //       return {
  //         label: 'Enterprise',
  //         gradient: 'linear-gradient(135deg, #8b5cf6 0%, #6d28d9 100%)',
  //         color: 'white',
  //       };
  //     case 'standard':
  //     case 'standard plan':
  //       return {
  //         label: 'Standard',
  //         gradient: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
  //         color: 'white',
  //       };
  //     case 'free':
  //     default:
  //       return {
  //         label: 'Free',
  //         gradient: 'linear-gradient(135deg, #6b7280 0%, #4b5563 100%)',
  //         color: 'white',
  //       };
  //   }
  // };

  // const planConfig = getPlanConfig(userPlan);

  const drawerContent = (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <DrawerHeader>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          {/* <Image
            src={logoDash}
            width={40}
            height={40}
            alt="Limbu.AI"
          /> */}
          {open && (
            <Link href="/">
              <Typography
                variant="h6"
                sx={{
                  fontWeight: 700,
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  letterSpacing: '-0.5px',
                }}
              >
                {/* Limbu.AI */}
              </Typography>
            </Link>
          )}
        </Box>
        {open && (
          <IconButton onClick={handleDrawerToggle} size="small">
            {theme.direction === 'rtl' ? <ChevronRightIcon /> : <ChevronLeftIcon />}
          </IconButton>
        )}
      </DrawerHeader>

      <Divider sx={{ borderColor: 'rgba(102, 126, 234, 0.1)' }} />

     <List sx={{ flex: 1, overflowY: 'auto', px: 1.5, pt: 2 }}>
  {visibleMenuItems.map((item, index) => {
    const isDropdown = !!item.children;
    const isOpen = openDropdown === index;

    const isActive =
      item.path === pathname ||
      (item.children && item.children.some(c => c.path === pathname));

    const navigateTo = (path) => {
      let finalPath = path;

      if (path.includes("[bussiness]")) {
        const slug =
          locationCheck &&
          locationCheck.trim().replace(/\s+/g, "-").toLowerCase();

        finalPath = path.replace("[bussiness]", slug);
      }

      if (isMobile) handleDrawerToggle();
      router.push(finalPath);
    };

    return (
      <div key={index}>
        {/* MAIN BUTTON */}
        <ListItem disablePadding sx={{ display: "block", mb: 0.5 }}>
          <ListItemButton
            onClick={() => {
              if (isDropdown) {
                setOpenDropdown(isOpen ? null : index);
              } else {
                navigateTo(item.path);
              }
            }}
            sx={{
              minHeight: 44,
              justifyContent: open ? "initial" : "center",
              px: 2,
              mx: 1.5,
              borderRadius: "10px",
              transition: "all 0.2s ease-in-out",

              /* ACTIVE COLOR */
              bgcolor: isActive ? "#0F172A" : "transparent",
              color: isActive ? "#ffffff" : "#475569",

              "&:hover": {
                background: isActive
                  ? "#0F172A"
                  : "rgba(0,0,0,0.04)",
                transform: "translateX(2px)",
                color: isActive ? "#ffffff" : "#1e293b",
              },
            }}
          >
            <ListItemIcon
              sx={{
                minWidth: 0,
                mr: open ? 2 : "auto",
                justifyContent: "center",
                color: isActive ? "#ffffff" : "#94a3b8",
              }}
            >
              {item.icon}
            </ListItemIcon>

            <ListItemText
              primary={item.text}
              sx={{
                opacity: open ? 1 : 0,
                "& .MuiTypography-root": {
                  fontWeight: isActive ? 600 : 500,
                  fontSize: "0.9rem",
                },
              }}
            />

            {isDropdown && open && (
              <Box sx={{ color: isActive ? "#fff" : "#94a3b8", display: "flex" }}>
                {isOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
              </Box>
            )}
          </ListItemButton>
        </ListItem>

        {/* DROPDOWN CHILDREN */}
        {isDropdown && isOpen && open && (
          <div className="ml-4 mt-1 space-y-1 border-l-2 border-slate-100 pl-2">
            {item.children.map((sub, i) => {
              const isSubActive = sub.path === pathname;

              return (
                <ListItemButton
                  key={i}
                  onClick={() => navigateTo(sub.path)}
                  sx={{
                    pl: 2,
                    py: 0.8,
                    borderRadius: "8px",
                    mb: 0.5,

                    bgcolor: isSubActive ? "#0F172A" : "transparent",
                    color: isSubActive ? "#ffffff" : "#64748b",

                    "&:hover": {
                      background: isSubActive
                        ? "#0F172A"
                        : "rgba(0,0,0,0.03)",
                      color: isSubActive ? "#ffffff" : "#1e293b",
                    },
                  }}
                >
                  <ListItemText
                    primary={sub.text}
                    sx={{
                      "& .MuiTypography-root": {
                        fontSize: "0.85rem",
                        fontWeight: isSubActive ? 600 : 400,
                      },
                    }}
                  />
                </ListItemButton>
              );
            })}
          </div>
        )}
      </div>
    );
  })}
</List>

      {/* <Box sx={{ p: 2, mt: 'auto' }}>
        <Box
          sx={{
            p: 2.5,
            borderRadius: 3,
            background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)',
            border: '1px solid #e2e8f0',
            textAlign: 'center',
          }}
        >
          <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 700, letterSpacing: '0.5px', display: 'block', mb: 0.5, fontSize: '0.7rem' }}>
            CURRENT PLAN
          </Typography>
          <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#1e293b', mb: 2, fontSize: '0.95rem' }}>
            {paidPackage || paidService || 'Free Plan'}
          </Typography>
          <Button
            variant="contained"
            size="small"
            fullWidth
            onClick={handleOpenPlansModal}
            sx={{
              background: '#1e293b',
              color: 'white',
              textTransform: 'none',
              fontWeight: 700,
              fontSize: '0.8rem',
              borderRadius: '8px',
              boxShadow: 'none',
              py: 0.8,
              '&:hover': {
                background: '#334155',
                boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
              }
            }}
          >
            Upgrade
          </Button>
        </Box>
      </Box> */}

      <Dialog
        open={plansModalOpen}
        onClose={handleClosePlansModal}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 3,
            background: '#f8fafc',
            // minHeight: '80vh'
          }
        }}
      >
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', pb: 1 }}>
          <Typography variant="h5" fontWeight="bold" sx={{ background: 'linear-gradient(to right, #2563eb, #7c3aed)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            My Subscription
          </Typography>
          <IconButton onClick={handleClosePlansModal} size="small">
            <X />
          </IconButton>
        </DialogTitle>
        
        <DialogContent>
           {subscriptionLoading ? (
             <Box display="flex" justifyContent="center" p={5}><CircularProgress /></Box>
           ) : (
             <Box>
               <Card sx={{ mb: 3, borderRadius: 2, boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
                 <CardContent>
                   <Grid container spacing={2}>
                     <Grid item xs={12}>
                       <Typography variant="subtitle2" color="text.secondary">Current Plan</Typography>
                       <Typography variant="h5" fontWeight="bold" color="primary.main">
                         {paidPackage || paidService || 'Free Plan'}
                       </Typography>
                     </Grid>
                     
                     {subscriptionData?.subscription?.status === 'active' && (
                       <>
                         <Grid item xs={6}>
                           <Typography variant="subtitle2" color="text.secondary">Start Date</Typography>
                           <Typography variant="body1" fontWeight="500">
                             {subscriptionData.subscription.date ? new Date(subscriptionData.subscription.date).toLocaleDateString() : 'N/A'}
                           </Typography>
                         </Grid>
                         <Grid item xs={6}>
                           <Typography variant="subtitle2" color="text.secondary">Expiry Date</Typography>
                           <Typography variant="body1" fontWeight="500">
                             {subscriptionData.subscription.expiry ? new Date(subscriptionData.subscription.expiry).toLocaleDateString() : 'N/A'}
                           </Typography>
                         </Grid>
                         <Grid item xs={12}>
                            <Box display="flex" alignItems="center" gap={1} mt={1}>
                              <Typography variant="subtitle2" color="text.secondary">Status:</Typography>
                              <Chip 
                                label={subscriptionData.subscription.status} 
                                color="success" 
                                size="small" 
                                sx={{ fontWeight: 'bold', textTransform: 'capitalize' }} 
                              />
                            </Box>
                         </Grid>
                       </>
                     )}

                     {subscriptionPlans && (paidPackage || paidService) && (() => {
                        let plan = null;

                        // 1. Try finding by paidPackage + planDuration
                        if (paidPackage && currentPlanDuration) {
                          const cycleData = subscriptionPlans.billingCycles.find(c => c.cycle === currentPlanDuration);
                          if (cycleData) {
                            plan = cycleData.plans.find(p => p.title === paidPackage);
                          }
                        }

                        // 2. Fallback: Try finding by paidService (legacy or simple string match)
                        if (!plan && paidService) {
                           plan = subscriptionPlans.billingCycles.flatMap(c => c.plans).find(p => p.title === paidService);
                        }
                        
                        if (plan) {
                          return (
                            <Grid item xs={12}>
                              <Box sx={{ mt: 2, pt: 2, borderTop: '1px dashed #e2e8f0' }}>
                                
                                {plan.description && (
                                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2, fontStyle: 'italic', textAlign: 'center' }}>
                                    {plan.description}
                                  </Typography>
                                )}

                                <Grid container spacing={2} sx={{ mb: 2 }}>
                                  <Grid item xs={6}>
                                    <Box sx={{ p: 1.5, bgcolor: '#f8fafc', borderRadius: 2, border: '1px solid #e2e8f0', textAlign: 'center' }}>
                                      <Typography variant="caption" color="text.secondary" fontWeight="bold" display="block">POSTS</Typography>
                                      <Typography variant="h6" color="primary.main" fontWeight="bold">{plan.posts}</Typography>
                                    </Box>
                                  </Grid>
                                  <Grid item xs={6}>
                                    <Box sx={{ p: 1.5, bgcolor: '#fafcfe', borderRadius: 2, border: '1px solid #e2e8f0', textAlign: 'center' }}>
                                      <Typography variant="caption" color="text.secondary" fontWeight="bold" display="block">CITATIONS</Typography>
                                      <Typography variant="h6" color="primary.main" fontWeight="bold">{plan.citations}</Typography>
                                    </Box>
                                  </Grid>
                                </Grid>

                                <Box>
                                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                                    Plan: {plan.title} ({plan.duration})
                                  </Typography>
                                  <Typography variant="subtitle2" fontWeight="bold" gutterBottom sx={{ color: '#334155' }}>
                                    Plan Details: Start Date : {subscriptionData.packageStartDate ? new Date(subscriptionData.packageStartDate).toLocaleDateString() : 'N/A'} | Expiry Date : {subscriptionData.packageExpiryDate ? new Date(subscriptionData.packageExpiryDate).toLocaleDateString() : 'N/A'}
                                  </Typography>
                                  
                                </Box>
{/* 
                                <Box sx={{ mb: 2, p: 2, bgcolor: '#f0fdf4', borderRadius: 2, border: '1px solid #bbf7d0' }}>
                                   <Box display="flex" justifyContent="space-between" alignItems="center" mb={0.5}>
                                      <Typography variant="body2" color="text.secondary">Base Price</Typography>
                                      <Typography variant="body2" fontWeight="bold">₹{plan.basePrice}</Typography>
                                   </Box>
                                   <Box display="flex" justifyContent="space-between" alignItems="center" mb={0.5}>
                                      <Typography variant="body2" color="text.secondary">GST (18%)</Typography>
                                      <Typography variant="body2" fontWeight="bold">₹{plan.gst}</Typography>
                                   </Box>
                                   <Divider sx={{ my: 1, borderColor: '#bbf7d0' }} />
                                   <Box display="flex" justifyContent="space-between" alignItems="center">
                                      <Typography variant="subtitle2" fontWeight="bold">Total Value</Typography>
                                      <Typography variant="subtitle2" fontWeight="bold" color="success.main">₹{plan.totalAmount} / {plan.duration}</Typography>
                                   </Box>
                                </Box> */}

                                <Typography variant="subtitle2" fontWeight="bold" gutterBottom sx={{ color: '#334155' }}>
                                  Plan Features:
                                </Typography>
                                <Grid container spacing={1}>
                                  {plan.features && plan.features.map((feature, idx) => (
                                    <Grid item xs={12} key={idx}>
                                      <Box display="flex" alignItems="start" gap={1.5}>
                                        <CheckCircle size={16} color="#10b981" style={{ marginTop: 3, flexShrink: 0 }} />
                                        <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.85rem' }}>{feature}</Typography>
                                      </Box>
                                    </Grid>
                                  ))}
                                </Grid>
                              </Box>
                            </Grid>
                          );
                        }
                        return null;
                     })()}
                   </Grid>
                 </CardContent>
               </Card>

               <Grid container spacing={2}>
                 <Grid item xs={6}>
                   <Button 
                     fullWidth 
                     variant="outlined" 
                     size="large"
                     onClick={() => {
                       handleClosePlansModal();
                       router.push('/user-activity');
                     }}
                     startIcon={<Activity size={18} />}
                     sx={{ 
                       py: 1.5,
                       fontWeight: 'bold',
                       borderColor: '#667eea',
                       color: '#667eea',
                       '&:hover': {
                         borderColor: '#764ba2',
                         color: '#764ba2',
                         background: 'rgba(102, 126, 234, 0.04)'
                       }
                     }}
                   >
                     View Activity
                   </Button>
                 </Grid>
                 <Grid item xs={6}>
                   <Button 
                     fullWidth 
                     variant="contained" 
                     size="large"
                     onClick={() => {
                       handleClosePlansModal();
                       router.push('/#subscription-plans');
                     }}
                     sx={{ 
                       background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                       py: 1.5,
                       fontWeight: 'bold'
                     }}
                   >
                     Upgrade / Renew
                   </Button>
                 </Grid>
               </Grid>
             </Box>
           )}
        </DialogContent>
      </Dialog>
    </Box>
  );


  // Open dropdown by default (for the first dropdown menu)
  React.useEffect(() => {
    const targetIndex = menuItems.findIndex(item => item.text === 'Services & Packages');
    if (targetIndex !== -1) {
      setOpenDropdown(targetIndex);
    }
  }, []);



  return (
    <>
      <Box sx={{ display: 'flex', minHeight: '100vh' }}>
        <CssBaseline />
        <Toaster position="top-right" />

        <AppBar position="fixed" open={open}>
          <Toolbar sx={{ justifyContent: 'space-between' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              {!open && (
                <IconButton
                  color="inherit"
                  onClick={handleDrawerToggle}
                  edge="start"
                  sx={{
                    background: 'rgba(0, 0, 0, 0.05)',
                    '&:hover': {
                      background: 'rgba(0, 0, 0, 0.1)',
                    },
                  }}
                >
                <MenuIcon size={24} />
                </IconButton>
              )}
              <Link href="/" style={{ textDecoration: 'none', color: 'inherit' }}>
                <Typography
                  variant="h6"
                  sx={{
                    fontWeight: 700,
                    display: { xs: "none", sm: "flex" },
                    alignItems: "center",
                    gap: 1,
                  }}
                >
                <Image
                  src={logoDash}
                  width={40}       // <== increase/decrease size
                  height={80}
                  alt="Logo"
                  style={{ marginRight: 6 }}
                />
                Limbu.AI
              </Typography></Link>
              <Link href="/" style={{ textDecoration: 'none', color: 'inherit' }}>
                <Typography
                  variant="h6"
                  sx={{
                    fontWeight: 700,
                    display: { xs: "flex", sm: "none" },
                    alignItems: "center",
                    cursor: "pointer",
                    gap: 1
                  }}
                >
                  <Image
                    src={logoDash}
                    width={32}
                    height={32}
                    alt="Logo"
                  />
                  Limbu.AI
                </Typography>
              </Link>

            </Box>

            <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 1, sm: 2 } }}>
              {/* Notifications Icon */}

              {/* Plan Chip */}
              {(paidPackage || paidService) && (
                
  <Chip
    label={paidPackage || paidService}
    onClick={handleOpenPlansModal}
    sx={{
      fontWeight: 600,
      background: '#0B0F19',
      color: 'white',
      border: 'none',
      cursor: 'pointer',
      boxShadow: '0 2px 8px rgba(255, 94, 98, 0.3)',
      fontSize: { xs: '0.75rem', sm: '0.875rem' },
      height: { xs: 28, sm: 32 },

      '&:hover': {
        background: '#0B0F19',   // same as normal
        color: 'white',         // same as normal
        boxShadow: '0 2px 8px rgba(255, 94, 98, 0.3)', // same shadow
      }
    }}
  />
)}

              {/* Wallet Chip */}
             <Chip
  label={isMobile ? `${walletBalance}` : `${walletBalance} Coins`}
  icon={<AddCircleOutlineIcon sx={{ color: 'white !important' }} />}
  onClick={handleWalletClick}
  sx={{
    fontWeight: 600,
    background: '#0B0F19',
    color: 'white',
    border: 'none',
    cursor: 'pointer',
    boxShadow: '0 2px 8px rgba(16, 185, 129, 0.3)',
    fontSize: { xs: '0.75rem', sm: '0.875rem' },
    height: { xs: 28, sm: 32 },

    '&:hover': {
      background: '#0B0F19',
      color: 'yellow',
      boxShadow: '0 2px 8px rgba(16, 185, 129, 0.3)',
      transform: 'none',
      opacity: 1,
    },

    '& .MuiChip-icon': {
      fontSize: { xs: '1rem', sm: '1.25rem' },
    },
  }}
/>



              {/* User Menu */}
              <Box
                onClick={handleMenuOpen}
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1,
                  cursor: 'pointer',
                  padding: '4px 8px',
                  borderRadius: '8px',
                  transition: 'all 0.2s',
                  '&:hover': {
                    backgroundColor: '#eaecf0',
                  },
                }}
              >
                <Badge
                  variant="dot"
                  overlap="circular"
                  anchorOrigin={{
                    vertical: 'bottom',
                    horizontal: 'right',
                  }}
                  color="success"
                >
                  <Avatar
                    alt={userName || 'User'}
                    src={user?.image || user?.avatar}
                    sx={{
                      width: { xs: 32, sm: 36 },
                      height: { xs: 32, sm: 36 },
                       color: 'dark',
                      bgcolor: '#0B0F19',
                      fontWeight: 600,
                      color: 'white',
                    }}
                  >
                    {userName ? userName.charAt(0).toUpperCase() : 'U'}
                  </Avatar>
                </Badge>
                {!isMobile && (
                  <>
                    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                      <Typography variant="body2" sx={{ fontWeight: 600, lineHeight: 1.2 }}>
                        {userName || 'User'}
                      </Typography>
                      {userEmail && (
                        <Typography variant="caption" sx={{ opacity: 0.9, lineHeight: 1.2 }}>
                          {userEmail.length > 20 ? userEmail.substring(0, 20) + '...' : userEmail}
                        </Typography>
                      )}
                    </Box>
                    <ArrowDownIcon />
                  </>
                )}
              </Box>
            </Box>
          </Toolbar>
        </AppBar>

        {/* User Menu Dropdown */}
        <Menu
          anchorEl={anchorEl}
          open={Boolean(anchorEl)}
          onClose={handleMenuClose}
          transformOrigin={{ horizontal: 'right', vertical: 'top' }}
          anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
          PaperProps={{
            elevation: 8,
            sx: {
              mt: 1.5,
              minWidth: 220,
              borderRadius: 2,
              overflow: 'visible',
              filter: 'drop-shadow(0px 2px 8px rgba(139, 6, 6, 0.15))',
            },
          }}
        >
          <MenuItem disabled>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <Avatar
                alt={userName || 'User'}
                src={user?.image || user?.avatar}
                sx={{
                  width: 40,
                  height: 40,
                  bgcolor: '#364dd1',
                  fontWeight: 600,
                }}
              >
                {userName ? userName.charAt(0).toUpperCase() : 'U'}
              </Avatar>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                  {userName || 'No Name'}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {userEmail || 'No email'}
                </Typography>
              </Box>
            </Box>
          </MenuItem>
          <Divider />
          <MenuItem
            onClick={() => {
              handleMenuClose();
              router.push('/profile');
            }}
          >
            <ListItemIcon>
              <AccountIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText>Profile</ListItemText>
          </MenuItem>
          <MenuItem onClick={handleWalletClick}>
            <ListItemIcon>
              <WalletIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText>Wallet ({walletBalance} Coins)</ListItemText>
          </MenuItem>
          {/* <MenuItem onClick={handleUpgradeClick}>
            <ListItemIcon>
              <UpgradeIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText>
              {userPlan === 'Free' || subscriptionData?.subscription?.status !== 'active'
                ? 'Upgrade Plan'
                : 'Manage Subscription'}
            </ListItemText>
          </MenuItem> */}
          {showSettingsNav && (
            <MenuItem
              onClick={() => {
                handleMenuClose();
                router.push('/user-settings');
              }}
            >
              <ListItemIcon>
                <SettingsIcon fontSize="small" />
              </ListItemIcon>
              <ListItemText>Settings</ListItemText>
            </MenuItem>
          )}
          <Divider />
          <MenuItem
            onClick={handleSignOut}
            sx={{
              color: 'error.main',
              '&:hover': {
                backgroundColor: 'error.light',
                color: 'error.dark',
              },
            }}
          >
            <ListItemIcon>
              <LogoutIcon fontSize="small" color="error" />
            </ListItemIcon>
            <ListItemText>Logout</ListItemText>
          </MenuItem>
        </Menu>

        {/* Subscription Details Dialog */}
        {/* <Dialog
          open={upgradeDialogOpen}
          onClose={handleUpgradeDialogClose}
          maxWidth="md"
          fullWidth
          PaperProps={{
            sx: {
              borderRadius: 3,
              maxHeight: '90vh',
            },
          }}
        >
          <DialogTitle
            sx={{
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              color: 'white',
              fontWeight: 700,
            }}
          >
            Subscription Details
          </DialogTitle>
          <DialogContent sx={{ mt: 3, overflowY: 'auto' }}>
            {subscriptionLoading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', py: 4 }}>
                <CircularProgress />
              </Box>
            ) : (
              <>
                <Card
                  sx={{
                    mb: 3,
                    background: 'linear-gradient(135deg, #f0fdf4 0%, #e0f2fe 100%)',
                    borderRadius: 2,
                    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                  }}
                >
                  <CardContent>
                    <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>
                      Current Plan
                    </Typography>
                    <Grid container spacing={2}>
                      <Grid item xs={12} sm={6}>
                        <Box sx={{ mb: 2 }}>
                          <Typography variant="body2" color="text.secondary">
                            Plan Name
                          </Typography>
                          <Typography variant="h6" sx={{ fontWeight: 600 }}>
                            {subscriptionData?.subscription?.plan || 'Free'}
                          </Typography>
                        </Box>
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <Box sx={{ mb: 2 }}>
                          <Typography variant="body2" color="text.secondary">
                            Status
                          </Typography>
                          <Chip
                            label={
                              subscriptionData?.subscription?.status === 'active' ? 'Active' : 'Inactive'
                            }
                            color={
                              subscriptionData?.subscription?.status === 'active' ? 'success' : 'default'
                            }
                            size="small"
                            sx={{ mt: 0.5 }}
                          />
                        </Box>
                      </Grid>
                      {subscriptionData?.subscription?.status === 'active' && (
                        <>
                          <Grid item xs={12} sm={6}>
                            <Box sx={{ mb: 2 }}>
                              <Typography variant="body2" color="text.secondary">
                                Start Date
                              </Typography>
                              <Typography variant="body1">
                                {new Date(subscriptionData.subscription.date).toLocaleDateString()}
                              </Typography>
                            </Box>
                          </Grid>
                          <Grid item xs={12} sm={6}>
                            <Box sx={{ mb: 2 }}>
                              <Typography variant="body2" color="text.secondary">
                                Expiry Date
                              </Typography>
                              <Typography variant="body1">
                                {new Date(subscriptionData.subscription.expiry).toLocaleDateString()}
                              </Typography>
                            </Box>
                          </Grid>
                          <Grid item xs={12} sm={6}>
                            <Box sx={{ mb: 2 }}>
                              <Typography variant="body2" color="text.secondary">
                                Order ID
                              </Typography>
                              <Typography
                                variant="body2"
                                sx={{
                                  fontFamily: 'monospace',
                                  fontSize: '0.85rem',
                                  wordBreak: 'break-all',
                                }}
                              >
                                {subscriptionData.subscription.orderId}
                              </Typography>
                            </Box>
                          </Grid>
                          <Grid item xs={12} sm={6}>
                            <Box sx={{ mb: 2 }}>
                              <Typography variant="body2" color="text.secondary">
                                Payment ID
                              </Typography>
                              <Typography
                                variant="body2"
                                sx={{
                                  fontFamily: 'monospace',
                                  fontSize: '0.85rem',
                                  wordBreak: 'break-all',
                                }}
                              >
                                {subscriptionData.subscription.paymentId}
                              </Typography>
                            </Box>
                          </Grid>
                          <Grid item xs={12}>
                            <Box sx={{ mb: 2 }}>
                              <Typography variant="body2" color="text.secondary">
                                Wallet Balance
                              </Typography>
                              <Typography variant="h6" sx={{ fontWeight: 600, color: '#10b981' }}>
                                {subscriptionData.wallet || walletBalance} Coins
                              </Typography>
                            </Box>
                          </Grid>
                        </>
                      )}
                    </Grid>
                  </CardContent>
                </Card>

                {subscriptionData?.subscription?.status !== 'active' && (
                  <Box
                    sx={{
                      p: 3,
                      background: 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)',
                      borderRadius: 2,
                      textAlign: 'center',
                    }}
                  >
                    <Typography variant="h6" sx={{ fontWeight: 700, mb: 1 }}>
                      Unlock Premium Features
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                      Upgrade your plan to access advanced features and boost your productivity!
                    </Typography>
                    <Button
                      variant="contained"
                      size="large"
                      onClick={() => {
                        handleUpgradeDialogClose();
                        router.push('/subscription');
                      }}
                      sx={{
                        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                        color: 'white',
                        fontWeight: 600,
                        px: 4,
                        '&:hover': {
                          background: 'linear-gradient(135deg, #5568d3 0%, #6941a0 100%)',
                        },
                      }}
                    >
                      View Plans & Upgrade
                    </Button>
                  </Box>
                )}
              </>
            )}
          </DialogContent>
          <DialogActions sx={{ p: 2, gap: 1 }}>
            <Button onClick={handleUpgradeDialogClose} variant="outlined">
              Close
            </Button>
            {subscriptionData?.subscription?.status === 'active' && (
              <Button
                onClick={() => {
                  handleUpgradeDialogClose();
                  router.push('/subscription');
                }}
                variant="contained"
                sx={{
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  '&:hover': {
                    background: 'linear-gradient(135deg, #5568d3 0%, #6941a0 100%)',
                  },
                }}
              >
                Change Plan
              </Button>
            )}
          </DialogActions>
        </Dialog> */}

        {/* Drawer */}
        {isMobile ? (
          <MuiDrawer
            variant="temporary"
            open={open}
            onClose={handleDrawerToggle}
            ModalProps={{
              keepMounted: true,
            }}
            sx={{
              '& .MuiDrawer-paper': {
                width: drawerWidth,
                boxSizing: 'border-box',
                background: '#ffffff',
              },
            }}
          >
            {drawerContent}
          </MuiDrawer>
        ) : (
          <Drawer variant="permanent" open={open}>
            {drawerContent}
          </Drawer>
        )}

        {/* Main Content */}
        <Box component="main" sx={{ flexGrow: 1, bgcolor: '#FFFFFF', minHeight: '100vh', p: { xs: 2, sm: 3 } }}>
          <DrawerHeader />
          {children}
        </Box>
      </Box>
    </>
  );
}