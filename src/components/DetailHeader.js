import React from 'react';
import {observer, inject} from 'mobx-react';
import IconButton from 'material-ui/IconButton';
import MenuItem from 'material-ui/MenuItem';
import SelectField from 'material-ui/SelectField';
import FontIcon from 'material-ui/FontIcon';
// import DatePicker from 'material-ui/DatePicker';
import { Button, Dropdown, Icon, Menu, Modal, Checkbox, Select,
          Tooltip, DatePicker, Radio, Table } from 'antd';
// import {RadioButton, RadioButtonGroup} from 'material-ui/RadioButton';
// import {
//   Table,
//   TableBody,
//   TableHeader,
//   TableHeaderColumn,
//   TableRow,
//   TableRowColumn,
// } from 'material-ui/Table';
import AddMail from "../views/items/AddMail";
import AddMaterial from "../views/items/AddMaterial";
import {BizDialog, ConfirmDialog} from "./Dialog";
import {CURRENCY} from "../services/bill";
import {detailStore} from "./Detail";
import MemberStore from "../views/stores/merchantMember";
import ManageBillItem from "../views/items/ManageBillItem";
import AddFinancialBill from '../views/items/AddFinancialBill';
import TotalMaterials from '../views/dashboard/materials/List';
import {formatTime} from '../utils/time';
import {ToastStore as Toast} from './Toast';

const Option = Select.Option;
const RadioGroup = Radio.Group;
const RadioButton = Radio.Button;

@inject('user')
@observer
export class DetailHeader extends React.Component {
  store = detailStore;

  constructor(props) {
    super(props);
    this.state = {
      openFollowActions: false,
      openMemberListDialog: false,
      showSelectItem: false,
      selectedItems: this.store.item_list,
      billItemsChanged: false,
    };
  }

  componentWillMount() {
    MemberStore.load();
  }

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
    noPadding: {
      padding: 0,
      paddingLeft: 0,
      paddingRight: 0,
      wordBreak: 'normal',
      whiteSpace: 'nowrap',
      overflow: 'hidden',
      textOverflow: 'ellipsis',
      textAlign: 'center'
    },
    styleLineNo: {
      width: 30,
    },
  };

  onClickDropDown = ({key}) => {
    const _self = this;
    switch (key) {
      case '1':
        _self.store.confirm_status ? _self.cancelConfirmBill() : _self.confirmBill();
        break;
      case '2':
        const txt = _self.props.detail.isProcurement ? '订单发货': '订单退货';
        this.setState({openFollowActions: false});
        const isSend = (txt === '订单发货');
        BizDialog.onOpen(txt, <ManageBillItem isSend={isSend}/>)
        break;
      case '3':
        _self.openAddFinBillDialog();
        break;
    }
  };

  dropDown = observer(() => {
    const menu = (<Menu onClick={this.onClickDropDown}>
        <Menu.Item key={'1'}>
          {this.store.confirm_status ? "取消确认单据": "确认单据"}
        </Menu.Item>
        <Menu.Item key={'2'}>
          {this.props.detail.isProcurement ? '订单退货': '订单退货'}
        </Menu.Item>
        {(this.store.detail.head.bill_type === 3 || this.store.detail.head.bill_type === 5) && (
          <Menu.Item key={'3'}>创建结算单</Menu.Item>
        )}
      </Menu>);
      return <Dropdown overlay={menu} trigger={['click']}>
      <a className="ant-dropdown-link" href="#">
        后续操作 <Icon type="down" />
      </a>
    </Dropdown>
  })

  // (
  //   <Menu>
  //     <Menu.Item key="0">
  //       <a target="_blank" rel="noopener noreferrer" href="http://www.alipay.com/">1st menu item</a>
  //     </Menu.Item>
  //     <Menu.Item key="1">
  //       <a target="_blank" rel="noopener noreferrer" href="http://www.taobao.com/">2nd menu item</a>
  //     </Menu.Item>
  //     <Menu.Divider />
  //     <Menu.Item key="3" disabled>3rd menu item（disabled）</Menu.Item>
  //   </Menu>
  // )

  ActionButton = ({icon, action, tooltip, active}) => {
    return <Button onClick={action} type="primary" shape="circle" icon="download" />
    // return (
    //   <IconButton
    //     iconClassName="material-icons"
    //     onClick={action}
    //     tooltip={tooltip}
    //     iconStyle={{...DetailHeader.styles.smallIcon, color: active ? '#189acf' : '#d9d7d3'}}
    //     style={DetailHeader.styles.small}>
    //     {icon}
    //   </IconButton>
    // )
  }

  onSend = () => alert('send');
  onSave = () => this.store.update();
  onCopy = () => alert('copy');
  onShare = () => alert('share');
  onAddNote = () => alert('add note');
  onClose = () => {
    if (this.store.shouldSaveBill) {
      BizDialog.onOpen('未保存修改，是否直接退出？', <ConfirmDialog submitAction={() => {
        BizDialog.onClose();
        this.props.onClose();
      }}/>)
    } else {
      this.props.onClose();
    }
  };

  handleFollowActions = event => {
    event.preventDefault();
    this.setState({
      openFollowActions: true,
      anchorEl: event.currentTarget,
    });
  };

  handleFollowActionsClose = () => {
    this.setState({
      openFollowActions: false,
    });
  };

  onReply = () => {
    const {detail} = this.props;
    if (!detail) return;
    BizDialog.onOpen('回复邮件', <AddMail mail={{
      receiver_id: detail.sender,
      mail_title: `回复: ${detail.mail_title}`,
      // mail_content: `原文: "${detail.mail_content}"`,
    }}/>)
  };
  // onReplyAll = () => alert('replyAll');
  onForward = () => {
    const {detail} = this.props;
    if (!detail) return;
    BizDialog.onOpen('转发邮件', <AddMail mail={{
      mail_title: `转发: ${detail.mail_title}`,
      mail_content: `"原文: ${detail.mail_content}"`, // `"原文: ${detail.mail_content}"\n\n` 目前发送邮件不支持手动换行
    }}/>)
  };
  // onAttach = async () => {
  //   if (!window.FileReader) {
  //     return;
  //   }
  //   if (this.uploading) return;
  //   const files = await new Promise(resolve => {
  //     const input = document.createElement('input');
  //     input.type = 'file';
  //     input.onchange = e => resolve(e.target.files);
  //     input.click();
  //   });
  //   const file = files[0];
  //   this.uploading = true;
  //   const data = new FormData();
  //   data.append('uploadfile', file);
  //   try {
  //     // const resp = await uploadFile(data);
  //   } catch (e) {
  //     console.log(e);
  //   }
  //   this.uploading = false;
  // };

  get billTitle() {
    const {bill_type, isProcurement} = this.props.detail;
    switch (bill_type) {
      default: return '单据';
      case 1: return '产能反馈单';
      case 2: return '询报价单';
      case 3: return isProcurement ? '采购订单' : '销售订单';
      case 4: return '协议';
    }
  }

  openAddFinBillDialog = () => {
    this.setState({openFollowActions: false});
    BizDialog.onOpen('创建结算单', <AddFinancialBill />);
  };

  // openManageBillDialog = title => {
  //   console.log(title);
  //   this.setState({openFollowActions: false});
  //   const isSend = (title === '订单发货');
  //   console.log('发货')
  //   BizDialog.onOpen(title, <ManageBillItem isSend={isSend}/>)
  // };

  cancelConfirmBill = () => {
    this.setState({openFollowActions: false});
    this.store.cancelConfirmBill();
  };

  confirmBill = () => {
    this.setState({openFollowActions: false});
    this.store.confirmBill();
  };


  TitleItem = observer(() => {
    const {detail, isMail, confirm_status} = this.store;
    const iconBtnStyle = {backgroundColor: 'transparent', border: 'none', fontSize: 20};
    // const {head} = detail;
    if (isMail) {
      return (
        <div className="detail-title message">
          <p className="detail-label">邮件</p>
          <div>
            <this.ActionButton icon='reply' tooltip='回复' action={this.onReply}/>
            {/*<this.ActionButton icon='reply_all' tooltip='回复全部' action={this.onReplyAll}/>*/}
            <this.ActionButton icon='forward' tooltip='转发' action={this.onForward}/>
            {/*<this.ActionButton icon='attachment' tooltip='附件' action={this.onAttach}/>*/}
            <IconButton
              iconClassName="material-icons"
              onClick={this.props.onClose}
              iconStyle={DetailHeader.styles.smallIcon}
              style={{...DetailHeader.styles.small, marginLeft: 10}}>
              {'close'}
            </IconButton>
          </div>
        </div>
      );
    } else {
      return (
        <div className="detail-title order">
          <p className="detail-label">{this.billTitle}: {detail.head.bill_no}</p>
          <div>
            <Tooltip title='保存单据'>
              <Button style={iconBtnStyle} disabled={!this.store.shouldSaveBill} icon="save" onClick={this.onSave}/>
            </Tooltip>
            <div style={{ marginLeft: 10 }}>
              <this.dropDown />
            </div>
            <Tooltip title='关闭'>
              <Button style={iconBtnStyle} icon="close" onClick={this.onClose}/>
            </Tooltip>
          </div>
        </div>
      );
    }
  });

  MessageInfo = () => {
    const {detail} = this.props;
    return (
      <div className="message-info-item">
        <div className="title-container">
          <p className="detail-title-txt">标题: {detail.mail_title}</p>
          <p className="detail-time-txt">{detail.send_time}</p>
        </div>
        <div className="sender-info-item">
          <p>来自商户：</p>
          <p className="company-txt">{detail.sender_name} (id: {detail.sender})</p>
        </div>
        <p className="message-content" style={{color: '#333'}}>内容:</p>
        <p className="message-content" style={{color: '#333'}}>
          &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;{detail.mail_content}
        </p>
      </div>
    )
  };

  OrderInfo = observer(() => {
    const {detail} = this.props;
    const {isProcurement, head} = detail;
    const currentUser = this.props.user.user.current;
    const MemberList = MemberStore.memberList.filter(member => member.user_id !== currentUser.id);
    return (
      <div className="order-info-item">
        <div className="order-source">
          <p style={{maxWidth: 260}}>{isProcurement ? '供应商：' : '客户：'}{head.mer_name}</p>
          <p style={{maxWidth: 160}}>负责人: {head.user_name}</p>
          <p>{head.create_time}</p>
        </div>
        <div className="member-relatives">
          <p style={{color: '#999', position: 'relative', top: 3}}>关注人：</p>
          <div>
            <p>
              {this.store.notice_list.map((item, index) => (
                <span key={index}>{item.name}{index === (this.store.notice_list.length - 1) ? null : '；'}</span>))}
            </p>
            { !this.store.lockModifyBill && (
              <Button type="primary" onClick={() => this.setState({openMemberListDialog: true})}
                      shape={'circle'} size={'small'} icon="plus" />
            )}
            <Modal
              title='商户成员列表'
              zIndex={1302}
              visible={this.state.openMemberListDialog}
              footer={null}
              onCancel={() => this.setState({openMemberListDialog: false})}>
              <div>
                {MemberList.length ? MemberList.map((member, key) => (
                  <Checkbox key={key}
                            checked={this.store.notice_list.findIndex(follow => follow.id === member.user_id) > -1}
                            onChange={(event, checked) => {
                              this.store.updateFollow(member, event.target.checked)
                            }}>{member.user_name}</Checkbox>
                )) : <p>暂无可添加成员</p>}
              </div>
            </Modal>
          </div>
        </div>
        {head.content && <p className='bill-content'>单据内容：<span>{head.content}</span></p>}
        <div className="select-actions" style={{marginBottom: 10, marginTop: 20}}>
          <Tooltip title='币种'>
            <Select style={{width: 160, marginRight: 20}} defaultValue={this.store.currency} disabled onChange={(value) => this.store.setKey('currency', value)}>
              { CURRENCY.map(((c, index) => <Option value={c.value} key={index}>{c.name}</Option>))  }
            </Select>
          </Tooltip>
          <Tooltip title='付款方式'>
            <Select style={{width: 160, marginRight: 20}} defaultValue={this.store.pay_type} disabled={isProcurement || this.store.lockModifyBill} onChange={(value) => this.store.setKey('pay_type', value)}>
              { ['', '现款现结', '月结'].map(((item, index) => <Option value={index}  key={index}>{item || '暂无'}</Option>)) }
            </Select>
          </Tooltip>
          <Tooltip title={'优先级(重要度与紧急度各一项)'}>
              <Select style={{width: 160}} mode="multiple" value={(this.store.priority.length && [...this.store.priority]) || ['NORMAL']}
                      onChange={ val => this.store.setKey('priority', (val && val.slice(0, 2)) || "")}>
                {[<Option value={'NOT_IMPORTENT'} key={0}>不重要</Option>,
                <Option value={'NORMAL'} key={1}>正常</Option>,
                <Option value={'IMPORTENT'} key={2}>重要</Option>,
                <Option value={'VERY_IMPORTENT'} key={3}>非常重要</Option>,
                <Option value={'HURRY'} key={4}>紧急</Option>,
                <Option value={'VERTY_HURRY'} keye={5}>非常紧急</Option>]}
              </Select>
          </Tooltip>
        </div>
        <div className={'select-actions'} style={{margin: '20px 0 20px 0'}}>
            {this.store.valid_begin_time ? (
              <DatePicker floatingLabelText="协议有效开始时间"
                          style={{width: 160, marginRight: 20}}
                          disabled={isProcurement || this.store.lockModifyBill}
                          defaultDate={new Date(this.store.valid_begin_time)}
                          onChange={(value) => {
                            this.store.setKey('valid_begin_time', new Date(value.toDate()).getTime())
                          }}/>
            ): (
              <DatePicker placeholder={'协议有效开始时间'}
                          disabled
                          style={{width: 160, marginRight: 20}}
                          onChange={(value) => {
                            this.store.setKey('valid_begin_time', new Date(value.toDate()).getTime())
                          }}/>
            )}
            {this.store.valid_end_time ? (
              <DatePicker placeholder="协议有效结束时间"
                          style={{width: 160}}
                          disabled={isProcurement || this.store.lockModifyBill}
                          defaultDate={new Date(this.store.valid_end_time)}
                          onChange={(value) => this.store.setKey('valid_end_time', new Date(value).getTime())}/>
            ) : (
              <DatePicker style={{width: 160}} placeholder="协议有效结束时间" disabled={isProcurement || this.store.lockModifyBill}
                          onChange={(value) => this.store.setKey('valid_end_time', new Date(value).getTime())}/>
            )}
        </div>
        <div style={{marginTop: 20, marginBottom: 20}} className="bill-price flex-row">
          <RadioGroup disabled defaultValue={this.store.tax_flag}>
            <Radio value={1}>含税</Radio>
            <Radio value={0}>不含税</Radio>
          </RadioGroup>
          <p className="price-txt">
            <span>总价：{`${head.amount}`.replace(/\d{1,3}(?=(\d{3})+$)/g,function(s){ return s+',' })}</span>
            <span>税率: {head.tax_rate}</span>
          </p>
          <div/>
        </div>
        <this.GoodsTable />
        {/*{*/}
          {/*!isProcurement && !this.store.lockModifyBill && (*/}
            {/*<button onClick={this.openSelectItem}*/}
                    {/*className="btn-add-goods" style={{marginLeft: 10}}>*/}
              {/*<FontIcon className="material-icons" color="#333" style={{fontSize: 16}}>add_circle_outline</FontIcon>*/}
            {/*</button>*/}
          {/*)*/}
        {/*}*/}
      </div>
    );
  });

  onCellClick = (row,column) => {
    if (this.store.detail.isProcurement) Toast.show('只有供应商可以修改物料行');
    if (this.store.detail.isProcurement || this.store.lockModifyBill) return;
    if (column > -1) {
      const selfConfirmed = this.store.item_list[row].confirm_status === 1;
      const relativeConfirmed = this.store.item_list[row].relative_confirm_status === 1;
      const itemConfirmed = relativeConfirmed || selfConfirmed;
      if (selfConfirmed) Toast.show('请取消物料确认状态再进行修改操作');
      if (relativeConfirmed) Toast.show('对方已确认物料，如需修改请通知对方');
      if (!itemConfirmed) this.store.openItemDialog(this.store.item_list[row]);
    }
  };

  onRowSelection = (value) => this.store.setConfirmedItem(value);

  get enableSelectAllItem() {
    let result = true;
    if (!this.store.detail.isProcurement) return result;
    this.store.item_list.forEach(item => {
      if (item.relative_confirm_status === 0) result = false;
    });
    return result;
  }

  GoodsTable = observer(() => {
    const {detail} = this.store;
    const {styles} = DetailHeader;
    const renderContent = (value, row) => (value || '-');
    const columns = [
      { title: '行号', dataIndex: 'line_no', key: 'line_no',
        render: renderContent},
      { title: '物料号', dataIndex: 'item_code', key: 'item_code' },
      { title: '客户物料号', dataIndex: 'source_no', key: 'source_no',colSpan: detail.isProcurement && 0,
        render: (value, row) => {
          const obj = {
            children: value || '-',
            props: {},
          }
          if(detail.isProcurement) {
            obj.props.rowSpan = 0;
          }
          return obj;
        }},
      { title: '规格备注', dataIndex: 'item_name', key: 'item_name', render: renderContent },
      { title: '数量', dataIndex: 'item_spec', key: 'item_spec', render: renderContent },
      { title: '单位', dataIndex: 'quantity', key: 'quantity', render: renderContent },
      { title: '单价', dataIndex: 'unit', key: 'unit',render: renderContent },
      { title: '金额', dataIndex: 'price', key: 'price',render: renderContent },
      { title: '交期/收货', dataIndex: 'amount', key: 'amount', render: renderContent },
      ]
    return <Table columns={columns} size={'small'}
                  dataSource={this.store.item_list} />;

    // return (
    //   <Table className="goods-table" multiSelectable onCellClick={this.onCellClick} onRowSelection={this.onRowSelection}>
    //     <TableHeader enableSelectAll={this.enableSelectAllItem && !this.store.lockModifyBill} >
    //       <TableRow>
    //         <TableHeaderColumn style={{...styles.noPadding, width: 40}}>行号</TableHeaderColumn>
    //         <TableHeaderColumn style={{...styles.noPadding, width: 60}}>物料号</TableHeaderColumn>
    //         {!detail.isProcurement &&
    //           <TableHeaderColumn style={{...styles.noPadding, width: 60}}>客户物料号</TableHeaderColumn>
    //         }
    //         <TableHeaderColumn style={styles.noPadding}>物料名称</TableHeaderColumn>
    //         <TableHeaderColumn style={{...styles.noPadding, width: 50}}>规格备注</TableHeaderColumn>
    //         <TableHeaderColumn style={{...styles.noPadding, width: 50}}>数量</TableHeaderColumn>
    //         <TableHeaderColumn style={{...styles.noPadding, width: 50}}>单位</TableHeaderColumn>
    //         <TableHeaderColumn style={{...styles.noPadding, width: 50}}>单价</TableHeaderColumn>
    //         <TableHeaderColumn style={{...styles.noPadding, width: 50}}>金额</TableHeaderColumn>
    //         <TableHeaderColumn style={{...styles.noPadding, width: 70}}>交期/收货</TableHeaderColumn>
    //       </TableRow>
    //     </TableHeader>
    //     <TableBody showRowHover deselectOnClickaway={false}>
    //       {this.store.item_list.map((item, index) => (
    //         <TableRow key={index}
    //                   selectable={!this.store.lockModifyBill}
    //                   selected={this.store.currentComfirmedItems.findIndex(i => i === index) > -1}>
    //           <TableRowColumn style={{...styles.noPadding, width: 40}}>
    //             {/* 扩展行点击事件， 以修复点击行而不触发checkbox */}
    //             <div className="expend-tab-row"
    //                  onClick={(e) => { e.preventDefault(); e.stopPropagation(); this.onCellClick(index, 0);}}>
    //               <p>{item.line_no || '暂无'}</p>
    //             </div>
    //           </TableRowColumn>
    //           <TableRowColumn style={{...styles.noPadding, width: 60}}>
    //             <div className="expend-tab-row"
    //                  onClick={(e) => { e.preventDefault(); e.stopPropagation(); this.onCellClick(index, 1);}}>
    //               <p>{item.item_code || '暂无'}</p>
    //             </div>
    //           </TableRowColumn>
    //           {
    //             !detail.isProcurement && <TableRowColumn
    //             style={{...styles.noPadding, width: 60}}>
    //               <div className="expend-tab-row"
    //                    onClick={(e) => { e.preventDefault(); e.stopPropagation(); this.onCellClick(index, 2);}}>
    //                 <p>{item.source_no || '暂无'}</p>
    //               </div>
    //             </TableRowColumn>
    //           }
    //           <TableRowColumn style={styles.noPadding}>
    //             <div className="expend-tab-row"
    //                  onClick={(e) => { e.preventDefault(); e.stopPropagation(); this.onCellClick(index, !detail.isProcurement ? 3 : 2);}}>
    //               <p>{item.item_name || '暂无'}</p>
    //             </div>
    //           </TableRowColumn>
    //           <TableRowColumn style={{...styles.noPadding, width: 50}}>
    //             <div className="expend-tab-row"
    //                  onClick={(e) => { e.preventDefault(); e.stopPropagation(); this.onCellClick(index, !detail.isProcurement ? 4 : 3);}}>
    //               <p>{item.item_spec || '暂无'}</p>
    //             </div>
    //           </TableRowColumn>
    //           <TableRowColumn style={{...styles.noPadding, width: 50}}>
    //             <div className="expend-tab-row"
    //                  onClick={(e) => { e.preventDefault(); e.stopPropagation(); this.onCellClick(index, !detail.isProcurement ? 5 : 4);}}>
    //               <p>{item.quantity || 0}</p>
    //             </div>
    //             </TableRowColumn>
    //           <TableRowColumn style={{...styles.noPadding, width: 50}}>
    //             <div className="expend-tab-row"
    //                  onClick={(e) => { e.preventDefault(); e.stopPropagation(); this.onCellClick(index, !detail.isProcurement ? 6 : 5);}}>
    //               <p>{item.unit || '暂无'}</p>
    //             </div>
    //           </TableRowColumn>
    //           <TableRowColumn style={{...styles.noPadding, width: 50}}>
    //             <div className="expend-tab-row"
    //                  onClick={(e) => { e.preventDefault(); e.stopPropagation(); this.onCellClick(index, !detail.isProcurement ? 7 : 6);}}>
    //               <p>{item.price || 0}</p>
    //             </div>
    //           </TableRowColumn>
    //           <TableRowColumn style={{...styles.noPadding, width: 50}}>
    //             <div className="expend-tab-row"
    //                  onClick={(e) => { e.preventDefault(); e.stopPropagation(); this.onCellClick(index, !detail.isProcurement ? 8 : 7);}}>
    //               <p>{item.amount}</p>
    //             </div>
    //           </TableRowColumn>
    //           <TableRowColumn style={{...styles.noPadding, width: 70}}>
    //             <div className="expend-tab-row"
    //                  onClick={(e) => { e.preventDefault(); e.stopPropagation(); this.onCellClick(index, !detail.isProcurement ? 9 : 8);}}>
    //               <p>{this.formatDeliverTime(item.deliver_time) || '暂无'}</p>
    //             </div>
    //           </TableRowColumn>
    //         </TableRow>
    //       ))}
    //     </TableBody>
    //   </Table>
    // );
  });

  formatDeliverTime = (deliver_time) => {
    if (!deliver_time) return undefined;
    if (typeof deliver_time === 'number') {
      return formatTime(deliver_time, 'YYYY-MM-DD').slice(5, 10);
    }
    return deliver_time.slice(5, 10);
  }

  render() {
    const {isMail} = this.props;
    return (
      <div className="detail-header">
        <this.TitleItem />
        {isMail ? <this.MessageInfo /> : <this.OrderInfo />}
        <Modal
          title='物料'
          titleStyle={{fontSize: 18}}
          visible={this.store.openEditItemDialog}
          oncancel={this.store.closeItemDialog}>
          <AddMaterial material={this.store.editingMaterial}
                       // onDel={this.deleteMaterialItem}
                       isBill={true}
                       isBillEdit={true}
                       onUpdate={this.store.updateMaterialItem}
                       onclose={this.store.closeItemDialog}/>
        </Modal>
        <Modal
          title={(
            <div className='dialog-title-wrapper'>
              <span>选择物料</span>
              <Button primary onClick={this.setBillItems}>确定</Button>
            </div>
          )}
          titleStyle={{fontSize: 18}}
          autoScrollBodyContent
          visible={this.state.showSelectItem}
          onCancel={this.closeSelectItem}>
          <TotalMaterials
            isDialog={true}
            onRowSelection={this.onAddRowSelection}
            selected={this.state.selectedItems}
            confirmedItems={this.store.comfirmedItems.map(index => this.store.item_list[index])}
          />
        </Modal>
      </div>
    );
  }
  deleteMaterialItem = (item) => {
    let {selectedItems} = this.state;
    selectedItems = selectedItems.filter(raw => raw.item_id !== item.item_id);
    this.setState({selectedItems});
    this.store.deleteMaterialItem(item);
  }
  closeSelectItem = () => this.setState({showSelectItem: false});
  openSelectItem = () => this.setState({showSelectItem: true});
  setBillItems = () => {
    if (this.state.billItemsChanged) {
      let {selectedItems} = this.state;
      selectedItems = selectedItems.map(item => {
        const index = this.store.item_list.findIndex(i => i.item_id === item.item_id);
        // 若id一样，使用现有单据物料数据，更新物料数据源
        if (index > -1) {
          return this.store.item_list[index];
        }
        return item;
      });
      this.store.addMaterialItem(selectedItems);
    }
    this.closeSelectItem();
  }
  onAddRowSelection = (items) => {
    this.setState({selectedItems: items, billItemsChanged: true});
  }
}
