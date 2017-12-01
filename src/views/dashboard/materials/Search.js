import React from 'react';
import {observable, computed, action, runInAction} from 'mobx';
import {observer} from 'mobx-react';
import RaisedButton from 'material-ui/RaisedButton';
import CircularProgress from 'material-ui/CircularProgress';
import TextField from 'material-ui/TextField';
import SearchIcon from 'material-ui/svg-icons/action/search';
import SelectField from 'material-ui/SelectField';
import MenuItem from 'material-ui/MenuItem';
import {
  Table,
  TableBody,
  TableHeader,
  TableHeaderColumn,
  TableRow,
  TableRowColumn,
} from 'material-ui/Table';
import {BizDialog, ConfirmDialog} from '../../../components/Dialog';
import BaseSvc, {SearchType} from '../../../services/baseData';
import {ToastStore as Toast} from "../../../components/Toast";
import MaterialsStore from '../../stores/materials'



class SearchState {
  @observable searchKey = '';
  @observable searchResult = [];
  @observable searching = false;
  // @observable recordCount = 0;
  // @observable pageNo = 1;
  // @observable hasMore = false;
  @observable searchType = SearchType.ITEM_NO;
  @observable searched = false;
  // pageSize = 20;

  @computed get searchValidated() {
    return !!this.searchKey; // && this.searchKey.length === 18
  }

  @action search = async () => {
    if (this.searching || !this.searchValidated) return;
    this.searching = true;
    try {
      const resp = await BaseSvc.searchItem(this.searchKey, this.searchType);
      runInAction('after search', () => {
        if (resp.code === '0' && resp.data) {
          this.searchResult = resp.data;
          if (this.searchResult.length) {
            Toast.show('搜索成功');
          } else {
            Toast.show('没有找到相关单据');
          }
          // this.recordCount = resp.data.length;
          // this.hasMore = false;
        } else {
          this.searchResult = [];
          Toast.show(resp.msg || '没有找到相关单据');
        }
      });
    } catch (e) {
      console.log(e, 'search bill by key');
      Toast.show('没有找到相关单据');
    }
    this.searching = false;
    if (!this.searched) this.searched = true;
  }
}

@observer
export default class SearchItem extends React.Component {
  store = new SearchState();

  render() {
    return (
      <div className="board-search">
        <h3>搜索物料</h3>
        <SelectField
          floatingLabelText="查找类型"
          value={this.store.searchType}
          style={{marginRight: 20}}
          onChange={(event, index, val) => this.store.searchType = val}
        >
          <MenuItem value={SearchType.ITEM_NO} primaryText='物料编码' />
          <MenuItem value={SearchType.NAME} primaryText='物料名称' />
          <MenuItem value={SearchType.PARTNER} primaryText='合作伙伴物料编码或名称' />
          <MenuItem value={SearchType.ALL} primaryText='查询所有' />
        </SelectField><br/>
        <TextField
          floatingLabelText='请输入查找的关键字'
          value={this.store.searchKey}
          type='text'
          onChange={e => this.store.searchKey = e.target.value}
          style={{marginRight: 20}}
        />
        <RaisedButton label="查找" primary={this.store.searchValidated} icon={<SearchIcon />}
                      disabled={!this.store.searchValidated} onTouchTap={this.store.search}/>
        <br/>
        {/*<p style={{color: '#999', fontSize: 12}}>(最多返回100条查询结果)</p>*/}
        {this.store.searching && <CircularProgress size={28} style={{display: 'block', margin: '20px auto'}}/>}
        {!!(this.store.searchResult && this.store.searchResult.length) && <List store={this.store}/>}
      </div>
    );
  }
}

@observer
class List extends React.Component {
  render() {
    const tableRowStyle = {padding: 10};
    const {store} = this.props;
    const DS = store.searchResult;
    return (
      <div className='materials-wrapper'>
        <Table multiSelectable={true} onCellClick={this.onCellClick}>
          <TableHeader displaySelectAll={false} adjustForCheckbox={false}>
            <TableRow>
              <TableHeaderColumn style={{padding: 20, width: 50}}>ID</TableHeaderColumn>
              <TableHeaderColumn style={{...tableRowStyle, width: 80}}>自定义编码</TableHeaderColumn>
              <TableHeaderColumn style={tableRowStyle}>物料名称</TableHeaderColumn>
              <TableHeaderColumn style={{...tableRowStyle, width: 50}}>规格</TableHeaderColumn>
              <TableHeaderColumn style={{...tableRowStyle, width: 80}}>计量单位</TableHeaderColumn>
              <TableHeaderColumn style={{...tableRowStyle, width: 50}}>单价</TableHeaderColumn>
              <TableHeaderColumn style={tableRowStyle}>创建日期</TableHeaderColumn>
              <TableHeaderColumn style={{padding: 20}}>操作</TableHeaderColumn>
            </TableRow>
          </TableHeader>
          <TableBody showRowHover displayRowCheckbox={false} deselectOnClickaway={false}>
            {DS.map((item, key) => (
              <TableRow key={key}>
                <TableRowColumn style={{padding: 20, width: 50}}>{item.item_id}</TableRowColumn>
                <TableRowColumn style={{...tableRowStyle, width: 80}}>{item.item_code}</TableRowColumn>
                <TableRowColumn style={tableRowStyle}>{item.item_name}</TableRowColumn>
                <TableRowColumn style={{...tableRowStyle, width: 50}}>{item.item_spec}</TableRowColumn>
                <TableRowColumn style={{...tableRowStyle, width: 80}}>{item.unit}</TableRowColumn>
                <TableRowColumn style={{...tableRowStyle, width: 50}}>{item.price}</TableRowColumn>
                <TableRowColumn style={tableRowStyle}>{item.create_time}</TableRowColumn>
                <TableRowColumn style={tableRowStyle}>
                  <button className="btn-material-action" onClick={e => {
                    e.preventDefault();
                    MaterialsStore.openItemDialog(item);
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
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    );
  }
  onDelete = (item) => {
    if (!item) {return;}
    BizDialog.onOpen('确认删除', <ConfirmDialog submitAction={MaterialsStore.deleteMaterialItem.bind(null, item)}/>);
  }
  onCellClick = (row, column) => {
    if (column === 7) return;
    MaterialsStore.openItemDialog(this.props.store.searchResult[row]);
  }
}
