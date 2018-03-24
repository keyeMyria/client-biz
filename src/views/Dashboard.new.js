import React from 'react';
import { Layout, Menu, Icon, Avatar } from 'antd';
import { observer, inject } from 'mobx-react';
import { RouteWithSubRoutes } from "../router/index";
import {DialogComponent, BizDialog} from "../components/Dialog";
import DetailDrawer from "../components/Drawer";
import {ToastStore as Toast} from '../components/Toast';

// const { SubMent } = Menu;
const { Content, Sider } = Layout;


@inject('user')
@observer
export default class Dashboard extends React.Component {
  state = {
    collapsed: true,
  };
  constructor(props) {
    super(props);
    // console.log(props);
    if (!props.user) this.props.history.replace('/');
  }
  async componentWillMount() {
    if (this.props.match.path === '/v1/dashboard') {
      this.props.history.push('/v1/dashboard/user.index');
    }
  }
  reLogin = () => {
    this.props.user.logout();
    this.props.history.replace('/');
  };

  onCollapse = (collapsed) => {
    this.setState({ collapsed });
  };

  handleClick = (e) => {
    console.log(e.key, e);
    if (!e.key) return;
    this.props.history.replace(`/v1/dashboard/${e.key}`);
  };
  render() {
    const {routes} = this.props;
    return (
      <Layout style={{ minHeight: '100vh' }}>
        <Sider collapsible
               collapsed={this.state.collapsed}
               onCollapse={this.onCollapse}>
          <Menu theme={'dark'}
                onClick={this.handleClick}
                defaultSelectedKeys={['user.index']}>
            <Menu.Item key="user.index">
              <Icon type="desktop" />
              <span>我的工作台</span>
            </Menu.Item>
            <Menu.Item key="merchant">
              <Icon type="idcard" />
              <span>商户</span>
            </Menu.Item>
            <Menu.Item key="partner">
              <Icon type="usergroup-add" />
              <span>伙伴</span>
            </Menu.Item>
            <Menu.Item key="materials">
              <Icon type="global" />
              <span>物料</span>
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