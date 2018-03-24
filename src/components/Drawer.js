import React from 'react';
import { observable, action} from 'mobx';
import { observer } from 'mobx-react';
import Drawer from 'material-ui/Drawer';
// import Drawer from 'rc-drawer';
// import { Drawer } from 'antd-mobile';
import {Detail} from './Detail';
import{detailStore} from "./Detail";
import {BizDialog, ConfirmDialog} from "./Dialog"

class DrawerState {
  @observable open = false;
  @observable width = 500;
  @observable contentDS = null;

  @action onOpen = (message) => {
    if (!message) return;
    this.contentDS = message;
    this.open = true;
  };

  @action onClose = () => {
    this.open = false;
    this.width = 500;
    this.contentDS = null;
    BizDialog.onClose();
  };

  @action setWidth = width => this.width = width;
}

export const DrawerStore = new DrawerState();

@observer
export default class DetailDrawer extends React.Component {
  store = DrawerStore;
  onRequestChange = () => {
    if (detailStore.shouldSaveBill) {
      BizDialog.onOpen('是否不保存改动直接退出？', <ConfirmDialog submitAction={this.store.onClose}/>);
      return;
    }
    // this.store.onClose();
  };
  render() {
    // return (<Drawer
    //   anchor="right"
    //   open={this.store.open}
    //   width={this.store.width}
    //   position='right'
    //   docked={false}
    //   style={{transition: 'width .3s linear', height: '100vh', overflow:'auto'}}
    //   transitions={true}
    //   onOpenChange={this.onRequestChange}
    // >
    //   {
    //     this.store.contentDS && <Detail style={{ overflow: 'auto' }} message={this.store.contentDS} close={this.store.onClose}/>
    //   }
    // </Drawer>);
    return (
      <Drawer
        width={this.store.width}
        style={{transition: 'width .3s linear'}}
        openSecondary={true}
        open={this.store.open}
        docked={true}
        onRequestChange={this.onRequestChange}>
        {
          this.store.contentDS && <Detail style={{ overflow: 'auto' }} message={this.store.contentDS} close={this.store.onClose}/>
        }
      </Drawer>
    );
  }
}
