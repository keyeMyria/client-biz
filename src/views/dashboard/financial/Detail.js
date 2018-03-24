import React from 'react';
import {observable, computed, action, runInAction} from 'mobx';
import {observer} from 'mobx-react';
import {Button, Select, Tooltip, Checkbox, Form, Input, Table, Modal, Spin} from 'antd';
import Drawer from 'material-ui/Drawer';
import {BizDialog, ConfirmDialog} from "../../../components/Dialog";
import FinancialSvc from '../../../services/financialBill';
import {ToastStore as Toast} from "../../../components/Toast";
import {CURRENCY} from "../../../services/bill";
import {FinStore} from './FinancialBoard';

const Option = Select.Option;

class DrawerState {
  @observable open = false;
  @observable detail = null;
  @observable invoiced_amount = '';
  @observable pay_amount = '';
  @observable settle_list = [];
  @observable editingSettleItem = {};
  @observable openSettleItemDialog = false;
  @observable confirm_status = 0;
  bill_no = null;

  @computed get billLocked() {
    return !!this.confirm_status || !!this.detail.head.relative_confirm_status;
  }

  @computed get needSaveChange() {
    const invoicedChanged = (this.invoiced_amount !== this.detail.head.invoiced_amount);
    const payChanged = (this.pay_amount !== this.detail.head.pay_amount);
    let settleListChanged = false;
    this.detail.settle_list.forEach(origin => {
      const index = this.settle_list.findIndex(item => item.line_no === origin.line_no);
      const current = this.settle_list[index];
      if (current.settle_amount !== origin.settle_amount) settleListChanged = true;
    });
    return invoicedChanged || payChanged || settleListChanged;
  }

  @action setKey = (key, val) => this[key] = val ? parseFloat(val) : '';

  @action onOpen = (bill) => {
    if (!bill || !bill.bill_no) return;
    this.bill_no = bill.bill_no;
    this.load();
    this.open = true;
  };

  @action onClose = () => {
    this.open = false;
    this.detail = null;
    BizDialog.onClose();
  };

  @action load = async () => {
    if (this.loading || !this.bill_no) return;
    this.loading = true;
    try {
      const resp = await FinancialSvc.getBill(this.bill_no);
      runInAction('after load detail', () => {
        if (resp.code === '0') {
          this.detail = resp.data;
          this.confirm_status = this.detail.head.confirm_status;
          this.invoiced_amount = this.detail.head.invoiced_amount;
          this.pay_amount = this.detail.head.pay_amount;
          this.settle_list = [...this.detail.settle_list];
        } else {
          Toast.show(resp.msg || '抱歉，获取结算单失败，请刷新页面后重新尝试');
          this.open = false;
        }
      });
    } catch (e) {
      console.log(e, 'load financial bill');
      Toast.show('抱歉，发生未知错误，请刷新页面后重新尝试');
    }
    this.loading = false;
  };

  @action save = async () => {
    if (this.saving || !this.needSaveChange) return;
    this.saving = true;
    try {
      const invoiced_amount = parseFloat(this.invoiced_amount);
      const pay_amount = parseFloat(this.pay_amount);
      const resp = await FinancialSvc.update(this.bill_no, invoiced_amount, pay_amount, this.settle_list);
      runInAction('after update bill', () => {
        if (resp.code === '0') {
          Toast.show('更新成功');
          this.detail.settle_list = [...this.settle_list];
          this.detail.head.invoiced_amount = parseFloat(this.invoiced_amount);
          this.detail.head.pay_amount = parseFloat(this.pay_amount);
          this.detail = {...this.detail};
        } else Toast.show(resp.msg || '抱歉，更新结算单失败，请刷新页面后重新尝试');
      });
    } catch (e) {
      console.log(e, 'saving fin bill');
      Toast.show('抱歉，发生未知错误，请刷新页面后重新尝试');
    }
    this.saving = false;
  };

  @action handleOpenSettleDialog = item => {
    this.editingSettleItem = item ? {line_no: item.line_no, settle_amount: item.settle_amount} : {};
    this.openSettleItemDialog = true;
  };

  @action handleCloseSettleDialog = () => {
    this.editingSettleItem = {};
    this.openSettleItemDialog = false;
  };

  @computed get editingValidated() {
    const {line_no, settle_amount} = this.editingSettleItem;
    return !!line_no && !!settle_amount;
  };

  @action setSettleItem = (key, value) => {
    if (key === 'settle_amount') value = value && parseFloat(value);
    this.editingSettleItem[key] = value;
    this.editingSettleItem = {...this.editingSettleItem};
  };

  @action confirmSettleItem = () => {
    if (!this.editingValidated) return;
    const index = this.settle_list.findIndex(item => item.line_no === this.editingSettleItem.line_no);
    this.editingSettleItem.source_no = this.bill_no;
    if (index === -1) {
      this.settle_list = [...this.settle_list, this.editingSettleItem]
    } else {
      this.settle_list[index] = this.editingSettleItem;
      this.settle_list = [...this.settle_list];
    }
    this.openSettleItemDialog = false;
    this.editingSettleItem = {}
  };

  @action onCheck = async (value) => {
    if (this.updating) return;
    this.updating = true;
    try {
      const service = this.confirm_status ? FinancialSvc.unConfirmBill : FinancialSvc.confirmBill;
      this.confirm_status = (value ? 1 : 0);
      const resp = await service(this.bill_no);
      runInAction("after update", () => {
        if (resp.code === '0') {
          Toast.show('更新成功');
          const detail = {...this.detail.head, confirm_status: this.confirm_status};
          FinStore.updateItemConfirm(detail);
        } else {
          Toast.show(resp.msg || '抱歉，更新失败，请刷新页面后重新尝试');
          this.confirm_status = this.confirm_status ? 0 : 1;
        }
      });
    } catch (e) {
      console.log(e, 'updating confirm status');
    }
    this.updating = false;
  }
}

export const FinancialDrawer = new DrawerState();

@observer
export default class FinancialDetail extends React.Component {
  store = FinancialDrawer;

  static styles = {
    smallIcon: {
      width: 24,
      height: 24,
      fontSize: 22,
      color: '#d9d7d3',
    },
    small: {
      width: 30,
      height: 30,
      padding: 4,
      marginLeft: 5,
    },
  };

  onRequestChange = () => {
    if (this.store.needSaveChange) {
      BizDialog.onOpen('是否不保存改动直接退出？', <ConfirmDialog submitAction={this.store.onClose}/>);
      return;
    }
    this.store.onClose();
  };

  get currency() {
    let text = '';
    CURRENCY.forEach(c => {
      if (c.value === this.store.detail.head.currency) text = c.name;
    });
    return text;
  }

  get payType() {
    let text = '';
    switch (this.store.detail.head.pay_type) {
      default: text = '未设置'; break;
      case 1: text = '现款现结'; break;
      case 2: text = '月结'; break;
    }
    return text;
  }

  render() {
    const {detail} = this.store;
    const iconBtnStyle = {backgroundColor: 'transparent', border: 'none', fontSize: 20};
    return (
      <Drawer
        width={620}
        openSecondary={true}
        open={this.store.open}
        docked={false}
        onRequestChange={this.onRequestChange}>
        {!this.store.detail ? (<div style={{textAlign: 'center'}}><Spin size="large" style={{marginTop: '40%'}}/></div>) : (
          <div>
            <div className="detail-title">
              <p className="detail-label">单据号: {this.store.detail.head.bill_no}</p>
              <div>
                <Tooltip title='保存单据'>
                  <Button style={iconBtnStyle} disabled={!this.store.needSaveChange} icon="save" onClick={this.store.save}/>
                </Tooltip>
                <Tooltip title='关闭'>
                  <Button style={iconBtnStyle} icon="close" onClick={this.onRequestChange}/>
                </Tooltip>
              </div>
            </div>
            <div style={{paddingLeft: 20, boxSizing: 'border-box'}}>
              <div className='detail-info'>
                <p>合作商户: {detail.head.mer_name}</p>
                <p>合作商户ID: {detail.head.mer_id}</p>
                <p>负责人: {`${detail.head.user_name || '暂无'} (id: ${detail.head.user_id})`}</p>
              </div>
              <Checkbox checked={this.store.confirm_status === 1} onChange={e => this.store.onCheck(e.target.checked)} style={{marginBottom: 10}}>
                {this.store.confirm_status === 1 ? '取消确认结算单' : '确认结算单'}
              </Checkbox>
              <Checkbox checked={detail.head.relative_confirm_status === 1} disabled style={{marginBottom: 10}}>
                合作商户确认状态
              </Checkbox>
              <br/>
              <div className='detail-form-item'>
                <Form.Item label='供应商已开票金额' style={{marginBottom: 10}}>
                  <Input
                    placeholder="未设置"
                    type="number"
                    disabled={this.store.billLocked}
                    value={this.store.invoiced_amount}
                    onChange={e => this.store.setKey('invoiced_amount', e.target.value)}
                  />
                </Form.Item>
                <Form.Item label='客户已付款金额' style={{marginBottom: 10}}>
                  <Input
                    placeholder="未设置"
                    type="number"
                    disabled={this.store.billLocked}
                    value={this.store.pay_amount}
                    onChange={e => this.store.setKey('pay_amount', e.target.value)}
                  />
                </Form.Item>
              </div>
              <div className='detail-form-item'>
                <Form.Item label='开票总金额' style={{marginBottom: 10}}>
                  <Input
                    disabled
                    value={detail.head.total_amount || "未设置"}
                    onChange={e => this.store.setKey('total_amount', e.target.value)}
                  />
                </Form.Item>
                <Form.Item label='币种' style={{marginBottom: 10}}>
                  <Input disabled value={this.currency || "未设置"}/>
                </Form.Item>
              </div>
              <div className='detail-form-item'>
                <Form.Item label='付款方式' style={{marginBottom: 10}}>
                  <Input
                    disabled
                    value={this.payType || "未设置"}
                    onChange={e => this.store.setKey('total_amount', e.target.value)}
                  />
                </Form.Item>
                <Form.Item label='含税标志' style={{marginBottom: 10}}>
                  <Input disabled value={detail.head.tax_flag ? '含税' : '不含税'}/>
                </Form.Item>
              </div>
              <div className='detail-form-item'>
                <Form.Item label='结算类型' style={{marginBottom: 10}}>
                  <Select disabled value={detail.head.settle_type} style={{width: '100%'}}>
                    {[
                      <Option value={0} key={0}>采购付款</Option>,
                      <Option value={1} key={1}>销售</Option>,
                    ]}
                  </Select>
                </Form.Item>
                <Form.Item label='发票类型' style={{marginBottom: 10}}>
                  <Select disabled value={detail.head.invoice_type} style={{width: '100%'}}>
                    {[
                      <Option value={0} key={0}>蓝色发票</Option>,
                      <Option value={1} key={1}>红字发票(冲减)</Option>,
                    ]}
                  </Select>
                </Form.Item>
              </div>
              <div className='detail-form-item'>
                <Form.Item label='创建时间' style={{marginBottom: 10}}>
                  <Input disabled value={detail.head.create_time || "未设置"}/>
                </Form.Item>
                <Form.Item label='更新时间' style={{marginBottom: 10}}>
                  <Input disabled value={detail.head.update_time || "未设置"}/>
                </Form.Item>
              </div>
              <br/><br/>
              <Table
                columns={[
                  {title: '物料行号', dataIndex: 'line_no', key: 'line_no', render: (value) => (value || '-')},
                  {title: '结算金额', dataIndex: 'settle_amount', key: 'settle_amount', render: (value) => (value || '-')},
                  {title: '操作', dataIndex: 'action', key: 'action', render: (value, row) => (
                      <Button disable={this.store.billLocked} onClick={() => this.store.handleOpenSettleDialog(row)}>
                        修改
                      </Button>
                    )},
                ]}
                size='small'
                style={{marginRight: 20}}
                dataSource={this.store.settle_list}
              />
            </div>
            <Modal
              title='编辑结算明细行'
              titleStyle={{fontSize: 18}}
              visible={this.store.openSettleItemDialog}
              okText='确认'
              cancelText='取消'
              onOk={this.store.confirmSettleItem}
              onCancel={this.store.handleCloseSettleDialog}>
              <div>
                <Form.Item label='行号' style={{marginBottom: 10, width: 300}}>
                  <Input disabled value={this.store.editingSettleItem.line_no || "未设置"}/>
                </Form.Item>
                <Form.Item label='结算金额' style={{marginBottom: 10, width: 300}}>
                  <Input
                    type="number"
                    value={this.store.editingSettleItem.settle_amount || "未设置"}
                    onChange={e => this.store.setSettleItem('settle_amount', e.target.value)}
                  />
                </Form.Item>
              </div>
            </Modal>
          </div>
        )}
      </Drawer>
    );
  }
}
