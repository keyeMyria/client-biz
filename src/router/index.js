import React from 'react';
import { Route } from 'react-router-dom';
import Login from '../views/account/Login';
import Register from '../views/account/Reg';
import Dashboard from '../views/Dashboard';
import NLogin from '../views/account/Login.new';
import NDashBoard from '../views/Dashboard.new';

import {
  My,
  Partner,
  Merchant,
  Materials,
  UserIndex,
} from '../views/dashboard/index';

const routes = [
  { path: '/',
    component: Login,
    exact: true,
  },
  {
    path: '/v1/login',
    component: NLogin,
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
        path: '/dashboard/merchant',
        component: Merchant,
      },
      {
        path: '/dashboard/partner',
        component: Partner,
      },
      {
        path: '/dashboard/materials',
        component: Materials,
      }
    ],
  },
  {
    path: '/v1/dashboard',
    component: NDashBoard,
    routes: [
      {
        path: '/v1/dashboard/main',
        component: UserIndex,
        exact: true,
      },
      {
        path: '/dashboard/merchant',
        component: Merchant,
      },
      {
        path: '/dashboard/partner',
        component: Partner,
      },
      {
        path: '/dashboard/materials',
        component: Materials,
      }
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