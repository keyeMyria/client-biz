import React from 'react';
import { observer, inject } from 'mobx-react';
import {observable, computed, action, runInAction} from 'mobx';
import TextField from 'material-ui/TextField';
import SelectField from 'material-ui/SelectField';
import MenuItem from 'material-ui/MenuItem';
import RaisedButton from 'material-ui/RaisedButton';
import CircularProgress from 'material-ui/CircularProgress';
import DatePicker from 'material-ui/DatePicker';
import Dialog from 'material-ui/Dialog';
import FloatingActionButton from 'material-ui/FloatingActionButton';
import ContentAdd from 'material-ui/svg-icons/content/add';
import {
  Table,
  TableBody,
  TableHeader,
  TableHeaderColumn,
  TableRow,
  TableRowColumn,
} from 'material-ui/Table';
import {BizDialog} from "../../components/Dialog";
import {ToastStore as Toast} from "../../components/Toast";
import BillSvc, {CURRENCY} from '../../services/bill';
import MerchantSvc from '../../services/merchant';
import Checkbox from 'material-ui/Checkbox';
import MemberStore from "../stores/merchantMember";
import AddMaterial from "./AddMaterial";
import {ProcurementStore} from '../dashboard/procurement/ProcurementBoard';

const BillType = {
  Feedback: {value: 1, name: '产能反馈单'},
  Inquiry: {value: 2, name: '询报价单'},
  Procurement: {value: 3, name: '采购订单'},
  Agreement: {value: 4, name: '协议'},
  Sale: {value: 5, name: '销售订单'},
};

class AddBillState {
  @observable bill_type = null;
  @observable relative_mer_id = '';
  @observable currency = null;
  @observable pay_type = null;
  @observable tax_flag = 0;
  @observable tax_rate = '';
  @observable valid_begin_time = '';
  @observable valid_end_time = '';
  @observable notice_list = [];
  @observable content = '';
  @observable priority = [];
  @observable item_list = [];
  @observable openMemberListDialog = false;
  @observable openAddItemDialog = false;
  @observable editingMaterial = {};
  @observable merchantsList = [];

  @computed get noticeNameStr() {
    const nameArr = this.notice_list.map(item => item.user_name);
    return nameArr.join(', ');
  }

  @computed get noticeIdStr() {
    const idArr = this.notice_list.map(item => item.user_id);
    return idArr.join(', ');
  }

  @computed get validated() {
    const taxRateValidated = this.tax_flag ? !!this.tax_rate : true;
    const defaultValidated = !!this.bill_type && !!this.relative_mer_id;
    let termsValidated = false;
    let itemListValidated = true;
    switch (this.bill_type) {
      default: return false;
      case BillType.Inquiry.value:
        termsValidated = !!this.currency && !!this.pay_type && !!this.item_list.length;
        this.item_list.forEach(item => {
          if (!(item.item_code && item.quantity && item.line_no)) {
            itemListValidated = false;
          }
        });
        return defaultValidated && taxRateValidated && termsValidated && itemListValidated;
      case BillType.Procurement.value:
      case BillType.Sale.value:
        termsValidated = !!this.item_list.length;
        this.item_list.forEach(item => {
          if (!(item.item_code && item.quantity && item.line_no && item.item_name && item.price)) {
            itemListValidated = false;
          }
        });
        return defaultValidated && taxRateValidated && termsValidated && itemListValidated;
      case BillType.Agreement.value:
        termsValidated = !!this.valid_begin_time && !!this.valid_end_time && !!this.content;
        return defaultValidated && termsValidated;
      case BillType.Feedback.value:
        termsValidated = !!this.content;
        return defaultValidated && termsValidated;
    }
  }

  @action setKey = (key, val) => this[key] = val;
  @action closeMemberDialog = () => this.openMemberListDialog = false;
  @action openMemberDialog = () => this.openMemberListDialog = true;
  @action openItemDialog = item => {
    if (item) this.editingMaterial = item;
    this.openAddItemDialog = true;
  };
  @action closeItemDialog = () => {
    this.editingMaterial = {};
    this.openAddItemDialog = false;
  };

  @action getBillNo = async () => {
    if (this.getting) return;
    this.getting = true;
    let bill_no = '';
    try {
      const key = '9deb17fa79572cdbe980ff9257009edd7fdb8a50';
      const resp = await BillSvc.getBillNo(key);
      runInAction('after get no', () => {
        if (resp.code === '0') {
          bill_no = resp.data.bill_no;
        } else Toast.show(resp.msg || '抱歉，操作失败，请稍后重试');
      });
    } catch (e) {
      console.log(e, 'get bill no');
      Toast.show('抱歉，发生未知错误，请稍后重试');
    }
    return bill_no;
  };

  @action submit = async () => {
    if (this.submitting || !this.validated) return;
    this.submitting = true;
    try {
      const bill_no = await this.getBillNo();
      if (!bill_no) return;
      const relative_mer_id = parseInt(this.relative_mer_id, 10);
      const bill_type = parseInt(this.bill_type, 10);
      const pay_type = parseInt(this.pay_type, 10);
      const tax_flag = parseInt(`${this.tax_flag}`, 10);
      const tax_rate = parseFloat(this.tax_rate);
      const notice_list = this.noticeIdStr;
      const item_list = this.item_list.length ? JSON.stringify([...this.item_list]) : null;
      const priority = this.priority.slice(0, 2).join(',');
      const resp = await BillSvc.create(bill_no, bill_type, relative_mer_id, this.currency, pay_type,
        tax_flag, tax_rate, this.valid_begin_time, this.valid_end_time, notice_list, this.content,
        priority, item_list);
      runInAction('after create bill', () => {
        if (resp.code === '0') {
          Toast.show('创建成功');
          ProcurementStore.refresh();
          BizDialog.onClose();
        } else Toast.show(resp.msg || '抱歉，创建失败，请稍后重试');
      });
    } catch (e) {
      console.log(e, 'submit add partner');
      Toast.show('抱歉，发生未知错误，请稍后重试');
    }
    this.submitting = false;
  };

  @action updateFollow = (member, checked) => {
    if (checked) {
      this.notice_list = [...this.notice_list, member];
    } else {
      this.notice_list = this.notice_list.filter(item => item.user_id !== member.user_id);
    }
  };

  @action addMaterialItem = item => this.item_list = [...this.item_list, item];
  @action deleteMaterialItem = item => this.item_list = this.item_list.filter(raw => raw.item_id !== item.item_id);
  @action updateMaterialItem = item => {
    const index = this.item_list.findIndex(r => r.item_id === item.item_id);
    if (index > -1) {
      this.item_list[index] = item;
    }
  };
  @action getMerchantList = async () => {
    try {
      const resp = await MerchantSvc.getMerchantListBySelfInCharge();
      runInAction('after get merchants', () => {
        if (resp.code === '0') {
          this.merchantsList = [...resp.data];
        } else Toast.show(resp.msg || '抱歉，获取用户负责商户失败，请刷新后重试');
      });
    } catch (e) {
      console.log(e, 'get merchant list by user in charge');
    }
  };
}

@inject('user')
@observer
export default class AddBill extends React.Component {
  store = new AddBillState();
  currentUser = this.props.user.user.current;
  componentWillMount() {
    MemberStore.load();
    this.store.getMerchantList();
  }

  render() {
    const followArray = [...this.store.notice_list];
    const tableRowStyle = {padding: 0};
    const followMemberSelection = MemberStore.memberList.filter(member => member.user_id !== this.currentUser.id);
    return (
      <form onSubmit={this.store.submit}>
        <SelectField
          floatingLabelText={!!this.store.merchantsList.length ? "合作商户ID（必填）" : '请通知管理员分配负责商户'}
          disabled={!this.store.merchantsList.length}
          value={this.store.relative_mer_id}
          style={{marginRight: 20}}
          onChange={(event, index, val) => this.store.setKey('relative_mer_id', val)}
        >
          {this.store.merchantsList.map((item, index) => (
            <MenuItem value={item.partner_id}
                      primaryText={`商户：${item.partner_name}`}
                      key={index}/>
          ))}
        </SelectField>
        <SelectField
          floatingLabelText="单据类型（必选）"
          value={this.store.bill_type}
          style={{marginRight: 20}}
          onChange={(event, index, val) => this.store.setKey('bill_type', val)}
        >
          <MenuItem value={BillType.Feedback.value} primaryText={BillType.Feedback.name} />
          <MenuItem value={BillType.Inquiry.value} primaryText={BillType.Inquiry.name} />
          <MenuItem value={BillType.Procurement.value} primaryText={BillType.Procurement.name} />
          <MenuItem value={BillType.Sale.value} primaryText={BillType.Sale.name} />
          <MenuItem value={BillType.Agreement.value} primaryText={BillType.Agreement.name} />
        </SelectField>
        <SelectField
          floatingLabelText={`汇率${this.store.bill_type === BillType.Inquiry.value ? '（必选）' : ''}`}
          value={this.store.currency}
          style={{marginRight: 20}}
          onChange={(event, index, val) => this.store.setKey('currency', val)}
        >
          {CURRENCY.map((item, index) => <MenuItem value={item.value} primaryText={item.name} key={index}/>)}
        </SelectField>
        <SelectField
          floatingLabelText={`付款方式${this.store.bill_type === BillType.Inquiry.value ? '（必选）' : ''}`}
          value={this.store.pay_type}
          style={{marginRight: 20}}
          onChange={(event, index, val) => this.store.setKey('pay_type', val)}
        >
          <MenuItem value={1} primaryText='现款现结' />
          <MenuItem value={2} primaryText='月结' />
        </SelectField>
        <SelectField
          floatingLabelText={`含税标志${this.store.bill_type === BillType.Inquiry.value ? '（必选）' : ''}`}
          value={this.store.tax_flag}
          style={{marginRight: 20}}
          onChange={(event, index, val) => this.store.setKey('tax_flag', val)}
        >
          <MenuItem value={0} primaryText='不含税' />
          <MenuItem value={1} primaryText='含税' />
        </SelectField>
        {!!this.store.tax_flag && <TextField
          floatingLabelText="税率（必填）"
          value={this.store.tax_rate}
          type="number"
          onChange={e => this.store.setKey('tax_rate', e.target.value)}
          style={{marginRight: 20}}
        />}<br/>
        <DatePicker floatingLabelText={`协议有效开始时间${this.store.bill_type === BillType.Agreement.value ? '（必填）' : ''}`}
                    onChange={(e, value) => this.store.setKey('valid_begin_time', new Date(value).getTime())}/>
        <DatePicker floatingLabelText={`协议有效结束时间${this.store.bill_type === BillType.Agreement.value ? '（必填）' : ''}`}
                    onChange={(e, value) => this.store.setKey('valid_end_time', new Date(value).getTime())}/>
        <TextField
          floatingLabelText={`单据文字内容${(this.store.bill_type === BillType.Feedback.value || this.store.bill_type === BillType.Agreement.value) ? '（必填）' : ''}`}
          value={this.store.content}
          type="text"
          multiLine={true}
          rows={1}
          rowsMax={4}
          onChange={e => this.store.setKey('content', e.target.value)}
          style={{marginRight: 20}}
        /><br/>
        <SelectField
          floatingLabelText="优先级(重要度与紧急度各一项)"
          value={this.store.priority}
          style={{marginRight: 20}}
          multiple={true}
          onChange={(event, index, val) => this.store.setKey('priority', (val && val.slice(0, 2)) || val)}
        >
          <MenuItem value='NOT_IMPORTENT' primaryText='不重要' insetChildren={true}
                    checked={this.store.priority.indexOf('NOT_IMPORTENT') > -1}/>
          <MenuItem value='NORMAL' primaryText='正常' insetChildren={true}
                    checked={this.store.priority.indexOf('NORMAL') > -1}/>
          <MenuItem value='IMPORTENT' primaryText='重要' insetChildren={true}
                    checked={this.store.priority.indexOf('IMPORTENT') > -1}/>
          <MenuItem value='VERY_IMPORTENT' primaryText='非常重要' insetChildren={true}
                    checked={this.store.priority.indexOf('VERY_IMPORTENT') > -1}/>
          <MenuItem value='HURRY' primaryText='紧急' insetChildren={true}
                    checked={this.store.priority.indexOf('HURRY') > -1}/>
          <MenuItem value='VERY_HURRY' primaryText='非常紧急' insetChildren={true}
                    checked={this.store.priority.indexOf('VERY_HURRY') > -1}/>
        </SelectField><br/>
        <TextField
          floatingLabelText="单据关注人列表"
          value={this.store.noticeNameStr}
          type="text"
          readOnly
          style={{marginRight: 20}}
        />
        <FloatingActionButton mini={true} style={{marginRight: 20}} onTouchTap={this.store.openMemberDialog}>
          <ContentAdd />
        </FloatingActionButton><br/>
        <Table>
          <TableHeader displaySelectAll={false} adjustForCheckbox={false}>
            <TableRow>
              <TableHeaderColumn style={{...tableRowStyle, width: 50}}>行号</TableHeaderColumn>
              <TableHeaderColumn style={tableRowStyle}>物料名称</TableHeaderColumn>
              <TableHeaderColumn style={tableRowStyle}>物料编码</TableHeaderColumn>
              <TableHeaderColumn style={tableRowStyle}>物料规格</TableHeaderColumn>
              <TableHeaderColumn style={tableRowStyle}>单位</TableHeaderColumn>
              <TableHeaderColumn style={tableRowStyle}>单价</TableHeaderColumn>
              <TableHeaderColumn style={tableRowStyle}>数量</TableHeaderColumn>
              <TableHeaderColumn style={tableRowStyle}>操作</TableHeaderColumn>
            </TableRow>
          </TableHeader>
          <TableBody showRowHover displayRowCheckbox={false}>
            {this.store.item_list.map((item, key) => (
              <TableRow key={key}>
                <TableRowColumn style={{...tableRowStyle, width: 50}}>{item.line_no}</TableRowColumn>
                <TableRowColumn style={tableRowStyle}>{item.item_name}</TableRowColumn>
                <TableRowColumn style={tableRowStyle}>{item.item_code}</TableRowColumn>
                <TableRowColumn style={tableRowStyle}>{item.item_spec}</TableRowColumn>
                <TableRowColumn style={tableRowStyle}>{item.unit}</TableRowColumn>
                <TableRowColumn style={tableRowStyle}>{item.price}</TableRowColumn>
                <TableRowColumn style={tableRowStyle}>{item.quantity}</TableRowColumn>
                <TableRowColumn style={tableRowStyle}>
                  <button className="btn-material-action" onClick={e => {
                    e.preventDefault();
                    this.store.openItemDialog(item);
                  }}>
                    修改
                  </button>
                  <button className="btn-material-action" onClick={e => {
                    e.preventDefault();
                    this.store.deleteMaterialItem(item);
                  }}>
                    删除
                  </button>
                </TableRowColumn>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        <div style={{textAlign: 'right'}}>
          <FloatingActionButton mini={true} style={{marginTop: 20}} onTouchTap={this.store.openItemDialog.bind(null, null)}>
            <ContentAdd />
          </FloatingActionButton>
        </div>
        <br/>
        <div>
          <p style={{marginTop: 15, fontSize: 14, color: '#CCC'}}>提示：</p>
          <p style={{fontSize: 12, color: '#CCC'}}>
            单据类型为询报价单时，物料行物料编码、行号、数量为必填；
          </p>
          <p style={{fontSize: 12, color: '#CCC'}}>
            单据类型为采购订单时，物料行名称、物料编码、行号、单价、数量为必填。
          </p>
        </div>
        <div style={{textAlign: 'right'}}>
          <RaisedButton style={{ marginTop: 20 }} label={this.store.submitting ? null : '确认'}
                        icon={this.store.submitting ? <CircularProgress size={28}/> : null}
                        primary={this.store.validated}
                        disabled={!this.store.validated}
                        onClick={this.store.submit} />
          <RaisedButton style={{ marginTop: 20, marginLeft: 20 }} label="取消"
                        primary={false} onClick={BizDialog.onClose} />
        </div>
        <Dialog
          title='商户成员列表'
          titleStyle={{fontSize: 18}}
          modal={false}
          autoScrollBodyContent
          open={this.store.openMemberListDialog}
          onRequestClose={this.store.closeMemberDialog}>
          <div>
            {followMemberSelection.length ? followMemberSelection.map((member, key) => (
              <Checkbox label={member.user_name} key={key}
                        checked={followArray.findIndex(follow => follow.user_id === member.user_id) > -1}
                        onCheck={(event, checked) => this.store.updateFollow(member, checked)}/>
            )): <p>暂无可添加成员</p>}
          </div>
        </Dialog>
        <Dialog
          title='物料'
          titleStyle={{fontSize: 18}}
          modal={false}
          autoScrollBodyContent
          open={this.store.openAddItemDialog}
          onRequestClose={this.store.closeItemDialog}>
          <AddMaterial material={this.store.editingMaterial}
                       onAdd={this.store.addMaterialItem}
                       onUpdate={this.store.updateMaterialItem}
                       onclose={this.store.closeItemDialog}/>
        </Dialog>
      </form>
    )
  }
}
