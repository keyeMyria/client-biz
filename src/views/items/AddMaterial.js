import React from 'react';
import { observer } from 'mobx-react';
import {observable, computed, action, runInAction} from 'mobx';
import TextField from 'material-ui/TextField';
import RaisedButton from 'material-ui/RaisedButton';
import DatePicker from 'material-ui/DatePicker';
import CircularProgress from 'material-ui/CircularProgress';
import SelectField from 'material-ui/SelectField';
import MenuItem from 'material-ui/MenuItem';
import Dialog from 'material-ui/Dialog';
import FlatButton from 'material-ui/FlatButton';
import {ToastStore as Toast} from "../../components/Toast";
import BaseSvc from '../../services/baseData';
import partnerStore from '../stores/partners';

const ItemFunc = {
  PURCHASE: "PURCHASE",
  SELL: "SELL",
};

class AddMaterialState {
  @observable name = '';
  @observable line_no = '';
  @observable item_code = '';
  @observable item_spec = '';
  @observable unit = '';
  @observable price = 0;
  @observable quantity = 0;
  @observable deliver_time = null;
  @observable submitting = false;
  @observable submitType = this.SubmitType.ADD;
  @observable partner_item_list = [{item_id: undefined, partner_id: undefined}];
  @observable item_func = [];
  id = null;
  isBill = false;
  isBillEdit = false;
  material = {};

  constructor(material) {
    if (!material) material = {};
    this.material = {...material};
    this.name = material.item_name || '';
    this.line_no = material.line_no || '';
    this.item_code = material.item_code || '';
    this.item_spec = material.item_spec || '';
    this.unit = material.unit || '';
    this.price = material.price || 0;
    this.quantity = material.quantity || 0;
    this.id = material.item_id;
    this.deliver_time = material.deliver_time || null;
    this.submitType = material.item_id ? this.SubmitType.MODIFY : this.SubmitType.ADD;
    this.isBill = material.isBill;
    this.isBillEdit = material.isBillEdit;
    this.partner_item_list = material.partner_item_list && material.partner_item_list.length ? material.partner_item_list : [{item_id: undefined, partner_id: undefined}];
    this.item_func = material.item_func || [];
  }

  SubmitType = {
    ADD: 0,
    MODIFY: 1,
  };

  @computed get validated() {
    let lineNoValidated = true;
    if (this.isBill && (this.line_no || this.line_no === 0)) {
      lineNoValidated = !(this.line_no < 10 || (this.line_no % 10 !== 0));
    }
    switch (this.submitType) {
      case this.SubmitType.ADD: return !!this.name && lineNoValidated;
      case this.SubmitType.MODIFY: return !!this.id && lineNoValidated;
      default: return false;
    }
  }

  @action setKey = (key, val) => this[key] = val;
  @action updateRelative = (index, item) => {
    if (item) {
      const update = this.partner_item_list.map((info, key) => index === key ? item : info);
      this.partner_item_list = [...update];
    }
  };
  @action submit = async (onCloseCallback, onAddCallBack) => {
    if (this.submitting || !this.validated) return;
    this.submitting = true;
    try {
      const price = parseFloat(`${this.price}`);
      const item_func = this.item_func.join(',');
      const partner_item_list = this.partner_item_list.filter(item => !(item.partner_id && item.item_id)).map(item => {item_id: item.item_id});
      const resp = await BaseSvc.addItem(this.name, this.item_code, this.item_spec, this.unit, price, item_func, partner_item_list);
      runInAction('after submit add', () => {
        if (resp.code === '0') {
          Toast.show('创建成功');
          if (this.isBill) {
            resp.data.line_no = this.line_no;
            resp.data.quantity = this.quantity;
            resp.data.deliver_time = this.deliver_time;
          }
          onAddCallBack && onAddCallBack(resp.data);
        }
        else Toast.show(resp.msg || '抱歉，操作失败，请稍后重试');
      })
    } catch (e) {
      console.log(e, 'submit material item');
      Toast.show('抱歉，发生未知错误，请稍后重试');
    }
    onCloseCallback && onCloseCallback();
    this.submitting = false;
  };

  @action update = async (onCloseCallback, onAddCallback, onUpdateCallback) => {
    if (this.isBillEdit) {
      const material = {
        ...this.material,
        amount: this.quantity * this.price,
        quantity: this.quantity,
        line_no: this.line_no,
        deliver_time: this.deliver_time,
      };
      onUpdateCallback && onUpdateCallback(material);
      onCloseCallback && onCloseCallback();
      return;
    }
    if (this.submitting || !this.validated) return;
    this.submitting = true;
    try {
      const price = parseFloat(`${this.price}`);
      const item_func = this.item_func.join(',');
      const partner_item_list = this.partner_item_list.filter(item => (item.partner_id && item.item_id));
      const partnerItems = partner_item_list.map(i => ({item_id: i.item_id}));
      const resp = await BaseSvc.updateItem(this.id, this.name, this.item_code, this.item_spec, this.unit, price, item_func, partnerItems);
      runInAction('after submit add', () => {
        if (resp.code === '0') {
          // onUpdateCallback && onUpdateCallback(resp.data);
        }
        else Toast.show(resp.msg || '抱歉，操作失败，请稍后重试');
      });
      if (!this.id || resp.code !== '0') return;
      const data = await BaseSvc.getItem(this.id);
      runInAction('after load item detail', () => {
        if (data.code === '0' && onUpdateCallback) {
          if (this.isBill) {
            data.data.line_no = this.line_no;
            data.data.quantity = this.quantity;
            data.data.deliver_time = this.deliver_time;
            data.data.amount = this.quantity * this.price;
          }
          onUpdateCallback(data.data);
          Toast.show('修改成功');
        } else Toast.show(data.msg || '抱歉，发生未知错误，请稍后重试');
      })
    } catch (e) {
      console.log(e, 'submit material item');
      Toast.show('抱歉，发生未知错误，请稍后重试');
    }
    onCloseCallback && onCloseCallback();
    this.submitting = false;
  };
}

const checkedRepeated = (line_no, items) => {
  const isRepeated = items.findIndex(i => i.line_no === line_no) > -1;
  if (isRepeated) {
    line_no += 10;
    return checkedRepeated(line_no, items);
  }
  return line_no;
}

@observer
class AddMaterial extends React.Component {
  constructor(props) {
    super(props);
    this.state = {loading: true}
  }
  async componentWillMount() {
    const {isBill, isBillEdit, items} = this.props;
    let {material} = this.props;
    try {
      if (material.item_id) {
        const resp = await BaseSvc.getItem(material.item_id);
        if (resp.code === '0' && resp.data) {
          material = resp.data;
        } else {
          Toast.show(resp.msg || '抱歉，获取物料失败，请检查物料是否已被删除');
          return;
        }
      }
    } catch (e) {
      console.log(e);
      Toast.show('抱歉，发生未知错误，请稍后重试');
    }
    material.isBill = !!isBill;
    material.isBillEdit = !!isBillEdit;
    if (!material.line_no && items && items.length >= 0) {
      material.line_no = checkedRepeated((items.length + 1) * 10, items);
    }
    this.store = new AddMaterialState(material);
    this.setState({loading: false});
  }
  render() {
    if (this.state.loading) return <div className='material-loading'><CircularProgress size={28}/></div>;
    const {material, onDel, isBill, isBillEdit} = this.props;
    const submitTxt = (material && material.item_id) ? '修改' : '创建';
    const submitAction = (material && material.item_id) ? this.store.update : this.store.submit;
    return (
      <form onSubmit={submitAction}>
        <TextField floatingLabelText="物料名称"
                   disabled={!!isBillEdit}
                   value={this.store.name} style={{marginRight: 20}}
                   onChange={(e, value) => this.store.setKey('name', value)}/>
        <TextField floatingLabelText="自定义物料编码"
                   disabled={!!isBillEdit}
                   value={this.store.item_code} style={{marginRight: 20}}
                   onChange={(e, value) => this.store.setKey('item_code', value)}/>
        {isBill && (
          <TextField floatingLabelText="行号（10的整数倍数）"
                     type="number"
                     disabled={!!isBillEdit}
                     value={this.store.line_no} style={{marginRight: 20}}
                     onChange={(e, value) => this.store.setKey('line_no', value ? parseInt(value, 10) : '')}/>
        )}
        <TextField floatingLabelText="规格备注"
                   disabled={!!isBillEdit}
                   value={this.store.item_spec} style={{marginRight: 20}}
                   onChange={(e, value) => this.store.setKey('item_spec', value)}/>
        {isBill && (
          <TextField floatingLabelText="数量"
                     type="number"
                     value={this.store.quantity} style={{marginRight: 20}}
                     onChange={(e, value) => this.store.setKey('quantity', value ? parseFloat(value) : '')}/>
        )}
        <TextField floatingLabelText="单位"
                   disabled={!!isBillEdit}
                   value={this.store.unit} style={{marginRight: 20}}
                   onChange={(e, value) => this.store.setKey('unit', value)}/>
        <TextField floatingLabelText="单价"
                   type="number"
                   value={this.store.price} style={{marginRight: 20}}
                   onChange={(e, value) => this.store.setKey('price', value ? parseFloat(value).toFixed(2) : '')}/>
        <br/>
        <SelectField
          floatingLabelText="物料用途"
          value={this.store.item_func}
          style={{marginRight: 20}}
          multiple={true}
          onChange={(event, index, val) => this.store.setKey('item_func', val)}
        >
          <MenuItem value={ItemFunc.PURCHASE} primaryText='采购' insetChildren={true}
                    checked={this.store.item_func.indexOf(ItemFunc.PURCHASE) > -1}/>
          <MenuItem value={ItemFunc.SELL} primaryText='销售' insetChildren={true}
                    checked={this.store.item_func.indexOf(ItemFunc.SELL) > -1}/>
        </SelectField>
        <br/>
        {isBill && (
          <TextField floatingLabelText="金额" readOnly style={{marginRight: 20}}
                     disabled={!!isBillEdit}
                     value={((this.store.quantity || 0) * (this.store.price || 0)).toFixed(2)}/>
        )}
        {(isBill && this.store.deliver_time) && (
          <DatePicker floatingLabelText="交期/收货" style={{marginRight: 20}}
                      defaultDate={new Date(this.store.deliver_time)}
                      onChange={(e, value) => this.store.setKey('deliver_time', new Date(value).getTime()) }/>
        )}
        {(isBill && !this.store.deliver_time) && (
          <DatePicker floatingLabelText="交期/收货" style={{marginRight: 20}}
                      onChange={(e, value) => this.store.setKey('deliver_time', new Date(value).getTime()) }/>
        )}
        {this.store.partner_item_list.map((item, key) => (
          <RelativeInfo
            isBillEdit={isBillEdit}
            key={key}
            item={item}
            update={this.store.updateRelative}
            index={key}
            lists={this.store.partner_item_list}
          />
        ))}
        <div style={{textAlign: 'right'}}>
          <RaisedButton style={{ marginTop: 20, marginRight: 20 }} label="添加关联信息" primary={true} onClick={this.addRelativeInfo} />
          <RaisedButton style={{ marginTop: 20 }} label={this.store.submitting ? null : submitTxt}
                        icon={this.store.submitting ? <CircularProgress size={28}/> : null}
                        primary={!!this.store.validated} disabled={!this.store.validated}
                        onClick={submitAction.bind(null, this.props.onclose, this.props.onAdd, this.props.onUpdate)} />
          {onDel && material && (
            <RaisedButton style={{ marginTop: 20, marginLeft: 20 }} label="删除" primary
                          onClick={() => {onDel(material); this.props.onclose();}} />)}
          <RaisedButton style={{ marginTop: 20, marginLeft: 20 }} label="取消"
                        primary={false} onClick={this.props.onclose} />
        </div>
      </form>
    )
  }
  addRelativeInfo = () => {
    let disable = false;
    this.store.partner_item_list.forEach(item => {
      if (!item.partner_id) {
        Toast.show('请填写关联合作商户ID');
        disable = true;
      }
    })
    if (!disable) this.store.partner_item_list.push({item_id: undefined, partner_id: undefined});
  }
}

export default AddMaterial;

@observer
class RelativeInfo extends React.Component {
  constructor(props) {
    super(props);
    this.state = {showSelectedPartners: false};
    if (!partnerStore.DS.length) partnerStore.load();
  }
  render() {
    const {isBillEdit, item, lists} = this.props;
    const {item_id, partner_id, partner_name} = item;
    const DS = partnerStore.DS.filter(p => lists.findIndex(selected => selected.partner_id === p.partner_id) < 0);
    return (
      <div>
        <TextField floatingLabelText="关联合作商户ID"
                   floatingLabelShrinkStyle={{wordWrap: 'none'}}
                   type="number"
                   readOnly
                   onClick={this.onOpenDialog}
                   value={partner_id} style={{marginRight: 20}}
                   onBlur={this.checkId}
                   onChange={this.setMerchant}/>
        {!!partner_name && <br/>}
        {!!partner_id && (
          <TextField floatingLabelText="关联物料ID"
                     type="number"
                     disabled={!!isBillEdit}
                     value={item_id} style={{marginRight: 20}}
                     onChange={this.setId}/>
        )}
        {(!!partner_id && !!partner_name) &&  (
          <TextField floatingLabelText="商户"
                     disabled={true}
                     value={partner_name} style={{marginRight: 20}}
                     onChange={this.setName}/>
        )}
        <Dialog
          title='合作商户'
          titleStyle={{fontSize: 18}}
          modal={false}
          autoScrollBodyContent
          open={this.state.showSelectedPartners}
          onRequestClose={this.onCloseDialog}>
          <div>
            {DS.map((merchant, index) => (
              <MenuItem
                key={index}
                value={merchant.partner_id}
                onTouchTap={this.setMerchant.bind(null, merchant.partner_id)}
                primaryText={merchant.inner_partner_name}
              />
            ))}
            {!DS.length && <p>暂无可选商户</p>}
            {partnerStore.hasMore && <FlatButton label="加载更多" primary={true} onTouchTap={partnerStore.load}/>}
          </div>
        </Dialog>
      </div>
    )
  }
  onOpenDialog = () => this.setState({showSelectedPartners: true});
  onCloseDialog = () => this.setState({showSelectedPartners: false}, () => this.checkId);
  checkId = () => {
    const {item, index, update, lists} = this.props;
    const {partner_id} = item;
    let disable = false;
    lists.forEach((info, key) => {
      const sameId = partner_id && partner_id === info.partner_id;
      const self = key === index;
      if (sameId && !self) disable = true;
    });
    if (disable) {
      Toast.show('已有相同商户ID, 请重新输入');
      const updatedItem = {...item, partner_id: ''};
      update(index, updatedItem);
    }
  }
  setMerchant = (value) => {
    const partner_id = value ? parseInt(value, 10) : '';
    const {item, index, update} = this.props;
    const updatedItem = {...item, partner_id};
    update(index, updatedItem);
    this.onCloseDialog();
  }
  setId = (e, value) => {
    const item_id = value ? parseInt(value, 10) : '';
    const {item, index, update} = this.props;
    const updatedItem = {...item, item_id};
    update(index, updatedItem);
  }
  setName = (e, relative_name) => {
    const {item, index, update} = this.props;
    const updatedItem = {...item, relative_name};
    update(index, updatedItem);
  }
}