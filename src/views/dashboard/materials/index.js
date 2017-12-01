import React from 'react';
import {observer} from 'mobx-react';
import FontIcon from 'material-ui/FontIcon';
import Dialog from 'material-ui/Dialog';
import FlatButton from 'material-ui/FlatButton';
import TotalMaterials from './List';
import AddMaterial from '../../items/AddMaterial';
import MaterialsStore from '../../stores/materials';
import Search from './Search';

const TABS = {
  LIST: 1,
  SEARCH: 2,
};

@observer
export default class Materials extends React.Component {
  materialsStore = MaterialsStore;
  constructor(props) {
    super(props);
    this.state={panel: TABS.LIST};
  }

  TabBar = () => {
    const {panel} = this.state;
    return (
      <div className="panel-nav flex-start">
        <a className="title" style={{boxSizing: 'border-box', paddingRight: 10}}>
          <FontIcon className="material-icons" color="#333">dashboard</FontIcon>
          <span>商户物料</span>
        </a>
        <FlatButton
          label={panel === TABS.LIST ? '查询' : '列表'}
          primary={true}
          onTouchTap={this.switchPanel}
        />
        <FlatButton
          label='新建'
          primary={true}
          onTouchTap={this.materialsStore.openItemDialog.bind(null, null)}
        />
      </div>
    );
  };

  renderContent = () => {
    switch (this.state.panel) {
      default: return null;
      case TABS.LIST: return <TotalMaterials/>;
      case TABS.SEARCH: return <div className="search-content"><Search /></div>;
    }
  };

  render() {
    return (
      <div className="search-layout">
        <this.TabBar />
        {this.renderContent()}
        <Dialog
          title='物料'
          titleStyle={{fontSize: 18}}
          modal={false}
          autoScrollBodyContent
          open={this.materialsStore.openAddItemDialog}
          onRequestClose={this.materialsStore.closeItemDialog}>
          <AddMaterial material={this.materialsStore.editingMaterial}
                       onAdd={this.materialsStore.addMaterialItem}
                       onUpdate={this.materialsStore.updateMaterialItem}
                       onclose={this.materialsStore.closeItemDialog}/>
        </Dialog>
      </div>
    );
  }
  switchPanel = () => {
    let {panel} = this.state;
    panel = panel === TABS.LIST ? TABS.SEARCH : TABS.LIST;
    this.setState({panel})
  }
}