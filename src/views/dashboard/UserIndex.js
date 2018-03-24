import React from 'react';
import FontIcon from 'material-ui/FontIcon';
import MainBoard from './main/MainBoard';
import ProcurementBoard from './procurement/ProcurementBoard';
import SaleBoard from './sale/SaleBoard';
import FinancialBoard from './financial/FinancialBoard';
// import Calendar from './calendar/Calendar';
// import {Tabs, Tab} from 'material-ui/Tabs';
import { Tabs, Icon } from 'antd';
const TabPane = Tabs.TabPane;

export default class MainDashboard extends React.PureComponent {
  state={ tabValue: 0 };

  handleTabsChange = tabValue => this.setState({ tabValue });

  TabBar = () => {
    const {tabValue} = this.state;
    const tabStyle = {color: '#777', fontSize: 16};
    return (
      <div className="panel-nav">
        <a className="title">
          <FontIcon className="material-icons" color="#333">dashboard</FontIcon>
          <span>我的工作台</span>
        </a>
        <div className="defaultRight" style={{width: 110, height: 50}}/>
      </div>
    );
  };

  PanelContent = () => {
    switch (this.state.tabValue) {
      case 0: return <MainBoard />;
      case 1: return <ProcurementBoard />;
      case 2: return <SaleBoard />;
      case 3: return <FinancialBoard />;
      default: return;
    }
  };

  render() {
    return (
      <div className="work-panel">
        <Tabs defaultActiveKey="1"
              tabBarStyle={{backgroundColor: 'white'}}
              forceRender
              >
          <TabPane tab={<span>看板</span>} key="1">
            <MainBoard />
          </TabPane>
          <TabPane tab={<span>采购</span>} key="2">
            <ProcurementBoard />
          </TabPane>
          <TabPane tab={<span>销售</span>} key="3">
            <SaleBoard />
          </TabPane>
          <TabPane tab={<span>结算</span>} key="4">
            <FinancialBoard />
          </TabPane>
        </Tabs>
      </div>
    );
  }
}
