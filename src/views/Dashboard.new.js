import React from 'react';
import { Layout, Menu, Breadcrumb, Icon, Avatar } from 'antd';
import { Link, withRouter } from 'react-router-dom';
import { observer, inject } from 'mobx-react';
import { RouteWithSubRoutes } from "../router/index";
import RaisedButton from 'material-ui/RaisedButton';
import Popover, {PopoverAnimationVertical} from 'material-ui/Popover';
// import Menu from 'material-ui/Menu';
import MenuItem from 'material-ui/MenuItem';
import AddMerchant from "./items/AddMerchant";
import AddBill from "./items/AddBill";
import DialogForm from "./items/DialogForm";
import ProfileDialog from "./items/ProfileDialog";
import Toast from "../components/Toast";
import {DialogComponent, BizDialog} from "../components/Dialog";
import DetailDrawer from "../components/Drawer";

const { SubMent } = Menu;
const { Footer, Content, Sider } = Layout;


@inject('user')
@observer
export default class Dashboard extends React.Component {
  state = {
    collapsed: true
  }
  constructor(props) {
    super(props);
    console.log(props);
    if (!props.user) this.props.history.replace('/');
  }
  // async componentWillMount() {
  //   if (this.props.match.path === '/dashboard') {
  //     this.props.history.push('/dashboard/main');
  //   }
  // }
  reLogin = () => {
    this.props.user.logout();
    this.props.history.replace('/');
  };

  onCollapse = (collapsed) => {
    this.setState({ collapsed });
  }
  render() {
    const {routes} = this.props;
    return (
      <Layout style={{ minHeight: '100vh' }}>
        <Sider collapsible
               collapsed={this.state.collapsed}
               onCollapse={this.onCollapse}>
          <Menu theme={'dark'}
                defaultSelectedKeys={['user.index']}>
            <Menu.Item key="user.index">
              <Icon type="desktop" />
              <span>我的工作台</span>
            </Menu.Item>
            <Menu.Item key="partarner">
              <Icon type="usergroup-add" />
              <span>伙伴</span>
            </Menu.Item>
            <Menu.Item key="material">
              <Icon type="global" />
              <span>物料</span>
            </Menu.Item>
            <Menu.Item key="4">
            </Menu.Item>
            <div style={{position: 'fixed', bottom: 60, left: this.state.collapsed ? 20 : 77 }}>
              <Avatar style={{backgroundColor: '#f56a00'}} size={'large'}>{this.props.user.user.current.name}</Avatar>
            </div>
          </Menu>
        </Sider>
        <Content style={{display: 'flex', flex: 1}}>
          {routes && routes.map((route, i) => (
            <RouteWithSubRoutes key={i} {...route}/>
          ))}
        </Content>
        <DialogComponent />
        <DetailDrawer />
      </Layout>
    )
  }
}