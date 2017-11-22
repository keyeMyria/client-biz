import React from 'react';
import {observer} from 'mobx-react';
import {
  Table,
  TableBody,
  TableHeader,
  TableHeaderColumn,
  TableRow,
  TableRowColumn,
} from 'material-ui/Table';
import CircularProgress from 'material-ui/CircularProgress';
import FlatButton from 'material-ui/FlatButton';
import MaterialsStore from '../../stores/materials';
import {BizDialog, ConfirmDialog} from '../../../components/Dialog';

@observer
export default class TotalMaterials extends React.Component {
  store = MaterialsStore;
  async componentWillMount() {
    if (!this.store.landed) this.store.load();
  }
  render() {
    const tableRowStyle = {padding: 10};
    const {isDialog, selected} = this.props;
    return (
      <div className={isDialog ? '' : 'materials-wrapper'}>
        <Table multiSelectable={true} onRowSelection={this.onRowSelection}>
          <TableHeader displaySelectAll={false} adjustForCheckbox={!!isDialog}>
            <TableRow>
              <TableHeaderColumn style={{padding: 20, width: 50}}>ID</TableHeaderColumn>
              <TableHeaderColumn style={{...tableRowStyle, width: 80}}>自定义编码</TableHeaderColumn>
              <TableHeaderColumn style={tableRowStyle}>物料名称</TableHeaderColumn>
              <TableHeaderColumn style={{...tableRowStyle, width: 50}}>规格</TableHeaderColumn>
              <TableHeaderColumn style={{...tableRowStyle, width: 80}}>计量单位</TableHeaderColumn>
              <TableHeaderColumn style={{...tableRowStyle, width: 50}}>单价</TableHeaderColumn>
              {!isDialog && <TableHeaderColumn style={tableRowStyle}>创建日期</TableHeaderColumn>}
              {!isDialog && <TableHeaderColumn style={{padding: 20}}>操作</TableHeaderColumn>}
            </TableRow>
          </TableHeader>
          <TableBody showRowHover displayRowCheckbox={!!isDialog} deselectOnClickaway={false}>
            {this.store.itemList.map((item, key) => (
              <TableRow key={key} selected={selected && selected.findIndex(i => i.item_id === item.item_id) > -1}>
                <TableRowColumn style={{padding: 20, width: 50}}>{item.item_id}</TableRowColumn>
                <TableRowColumn style={{...tableRowStyle, width: 80}}>{item.item_code}</TableRowColumn>
                <TableRowColumn style={tableRowStyle}>{item.item_name}</TableRowColumn>
                <TableRowColumn style={{...tableRowStyle, width: 50}}>{item.item_spec}</TableRowColumn>
                <TableRowColumn style={{...tableRowStyle, width: 80}}>{item.unit}</TableRowColumn>
                <TableRowColumn style={{...tableRowStyle, width: 50}}>{item.price}</TableRowColumn>
                {!isDialog && <TableRowColumn style={tableRowStyle}>{item.create_time}</TableRowColumn>}
                {!isDialog && (
                  <TableRowColumn style={tableRowStyle}>
                    <button className="btn-material-action" onClick={e => {
                      e.preventDefault();
                      this.store.openItemDialog(item);
                    }}>
                      修改
                    </button>
                    <button className="btn-material-action" onClick={e => {
                      e.preventDefault();
                      this.onDelete(item);
                    }}>
                      删除
                    </button>
                  </TableRowColumn>
                )}
              </TableRow>
            ))}
          </TableBody>
        </Table>
        {(!this.store.loading && !this.store.itemList.length && this.store.landed) && (
          <p className='none-data'>暂无物料</p>
        )}
        {this.store.loading && <CircularProgress style={{display: 'block', margin: '20px auto'}}/>}
        {this.store.hasMore && (
          <div style={{textAlign: 'right', width: '100%'}}>
            <FlatButton label="加载更多" primary={true} onTouchTap={this.store.load}/>
          </div>
        )}
      </div>
    );
  }
  onDelete = (item) => {
    if (!item) {return;}
    BizDialog.onOpen('确认删除', <ConfirmDialog submitAction={this.store.deleteMaterialItem.bind(null, item)}/>);
  }
  onRowSelection = (value) => {
    const {onRowSelection} = this.props;
    if (!onRowSelection) return;
    const items = value.map(value => this.store.itemList[value]);
    onRowSelection(items);
  }
}