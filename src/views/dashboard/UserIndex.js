import React from 'react';
import MainBoard from './main/MainBoard';
import ProcurementBoard from './procurement/ProcurementBoard';
import SaleBoard from './sale/SaleBoard';
import FinancialBoard from './financial/FinancialBoard';
import { Tabs } from 'antd'; // Icon
const TabPane = Tabs.TabPane;

export default class MainDashboard extends React.PureComponent {
  state={ tabValue: 0 };

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
              tabBarStyle={{backgroundColor: 'white', paddingLeft: 20}}
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
