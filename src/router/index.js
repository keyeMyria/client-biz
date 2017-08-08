import React from 'react';
import { Route } from 'react-router-dom';
import Login from '../views/account/Login';
import Register from '../views/account/Reg';
import Dashboard from '../views/Dashboard';
import {
  My,
  Partner,
  Search,
} from '../views/dashboard/index';

const routes = [
  {
    path: '/',
    component: Login,
    exact: true,
  },
  {
    path: '/register',
    component: Register,
    name: 'register',
  },
  {
    path: '/dashboard',
    component: Dashboard,
    routes: [
      {
        path: '/dashboard/main',
        component: My,
        exact: true,
      },
      {
        path: '/dashboard/search',
        component: Search,
      },
      {
        path: '/dashboard/partner',
        component: Partner,
      },
    ],
  },
];

const RouteWithSubRoutes = (route) => (
  <Route path={route.path} exact={route.exact} render={props => (
    // pass the sub-routes down to keep nesting
    <route.component {...props} routes={route.routes}/>
  )}/>
);

export {
  routes,
  RouteWithSubRoutes,
}