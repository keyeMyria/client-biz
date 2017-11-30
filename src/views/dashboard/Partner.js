import React from 'react';
import { observer, inject } from 'mobx-react';
import {observable, computed, action, runInAction} from 'mobx';
import FontIcon from 'material-ui/FontIcon';
import {List, ListItem} from 'material-ui/List';
import Divider from 'material-ui/Divider';
import Subheader from 'material-ui/Subheader';
import {grey400} from 'material-ui/styles/colors';
import IconButton from 'material-ui/IconButton';
import MoreVertIcon from 'material-ui/svg-icons/navigation/more-vert';
import SearchIcon from 'material-ui/svg-icons/action/search';
import MerchantIcon from 'material-ui/svg-icons/maps/local-mall';
import IconMenu from 'material-ui/IconMenu';
import MenuItem from 'material-ui/MenuItem';
import MailIcon from 'material-ui/svg-icons/content/mail';
import PartnerIcon from 'material-ui/svg-icons/social/group';
import CircularProgress from 'material-ui/CircularProgress';
import FlatButton from 'material-ui/FlatButton';
import RaisedButton from 'material-ui/RaisedButton';
import TextField from 'material-ui/TextField';
import {ToastStore as Toast} from "../../components/Toast";
import PartnerSvc from "../../services/partner";
import MerchantSvc from '../../services/merchant';
import {BizDialog, ConfirmDialog} from "../../components/Dialog";
import AddPartner from "../items/AddPartner";
import partnerStore, {InChargeStore} from '../stores/partners';

const ListType = {
  PARTNERS: 0,
  INVITE: 1,
  IN_CHARGE: 2,
};

class Invitations {
  @observable rawDS = [];
  @observable loading = false;
  @observable landed = false;

  @computed get DS() {
    return this.rawDS.filter(item => !item.accept_status);
  }

  @action load = async () => {
    if (this.loading) return;
    this.loading = true;
    try {
      const resp = await PartnerSvc.getInviteList();
      runInAction('after load invite', () => {
        if (resp.code === '0' && resp.data) {
          this.rawDS = resp.data;
        } else Toast.show(resp.msg);
      })
    } catch (e) {
      console.log(e, 'load partner invite');
      Toast.show('抱歉，发生未知错误，请检查网络连接稍后重试');
    }
    this.loading = false;
    if (!this.landed) this.landed = true;
  };

  @action accept = async (item) => {
    if (this.accepting || !item) return;
    this.accepting = true;
    try {
      const id = item.src_mer_id;
      const resp = await PartnerSvc.accept(id);
      runInAction('after accept', () => {
        if (resp.code === '0') {
          this.rawDS = this.rawDS.filter(item => item.src_mer_id !== id);
          partnerStore.load();
          Toast.show('已接受合作邀请');
        }else Toast.show(resp.msg || '抱歉，操作失败，请稍后重试');
      });
    } catch (e) {
      console.log(e, 'accept partner invite');
      Toast.show('抱歉，发生未知错误，请检查网络连接稍后重试');
    }
    this.accepting = false;
  };

  @action refuse = async (item) => {
    if (this.refusing || !item) return;
    this.refusing = true;
    try {
      const id = item.src_mer_id;
      const resp = await PartnerSvc.refuse(id);
      runInAction('after refuse', () => {
        if (resp.code === '0') {
          this.rawDS = this.rawDS.filter(item => item.src_mer_id !== id);
          partnerStore.load();
          Toast.show('已拒绝合作邀请');
        } else Toast.show(resp.msg || '抱歉，操作失败，请稍后重试');
      });
    } catch (e) {
      console.log(e, 'refuse partner invite');
      Toast.show('抱歉，发生未知错误，请检查网络连接稍后重试');
    }
    this.refusing = false;
  };
}

const InvitationStore = new Invitations();

const PartnerPanel = {
  List: 'list',
  Search: 'search',
};

@inject('user')
@observer
export default class Partner extends React.Component {
  constructor(props) {
    super(props);
    this.state = {panel: PartnerPanel.List};
  }
  render() {
    const {panel} = this.state;
    const isList = panel === PartnerPanel.List;
    const {current} = this.props.user.user;
    const isAdmin = current && (current.is_admin === 1);
    return (
      <div className="partner-container">
        <this.TabBar />
        {isList ? (
          <div className="main-board">
            <DataList type={ListType.PARTNERS} store={partnerStore}/>
            <DataList type={ListType.IN_CHARGE} store={InChargeStore}/>
            {isAdmin && <DataList type={ListType.INVITE} store={InvitationStore}/>}
          </div>
        ) : (
          <div className="main-board">
            <Search title='查询商户'/>
          </div>
        )}
      </div>
    );
  }
  TabBar = () => {
    const {current} = this.props.user.user;
    const isAdmin = current && (current.is_admin === 1);
    return (
      <div className="panel-nav flex-start">
        <a className="title" style={{boxSizing: 'border-box', paddingRight: 10}}>
          <FontIcon className="material-icons" color="#333">dashboard</FontIcon>
          <span>合作伙伴</span>
        </a>
        {isAdmin && (
          <FlatButton
            label={this.state.panel === PartnerPanel.List ? '查询' : '列表'}
            primary={true}
            onTouchTap={this.switchPanel}
          />
        )}
      </div>
    )
  };
  switchPanel = () => {
    let {panel} = this.state;
    panel = panel === PartnerPanel.List ? PartnerPanel.Search : PartnerPanel.List;
    this.setState({panel})
  }
}

const iconButtonElement = (
  <IconButton
    touch={true}
    tooltip="操作"
    tooltipPosition="bottom-left"
  >
    <MoreVertIcon color={grey400} />
  </IconButton>
);

const getPartnerType = type => {
  if (typeof type === 'string') {
    let str = type;
    str = str.replace('SHIPTO', '送达方');
    str = str.replace('PAYER', '付款方');
    str = str.replace('DRAWER', '开票方');
    return str;
  }
  if (type instanceof Array) {
    const formatType = type.map(raw => getPartnerType(raw));
    return formatType.join(',');
  }
  return '未设定';
};

const getPartnerFlag = flag => {
  if (typeof flag === 'string') {
    switch (flag) {
      case 'CUSTOMER': return '客户';
      case 'SUPPLIER': return '供应商';
      case 'CUSTOMER,SUPPLIER': return '客户、供应商';
      default: return '';
    }
  }
  if (flag instanceof Array) {
    const formatFlag = flag.map(raw => getPartnerFlag(raw));
    return formatFlag.join(',');
  }
  return '未设定';
};

@inject('user')
@observer
class DataList extends React.Component {
  store = this.props.store;
  componentWillMount() {
    this.store.load();
  }

  handleAddPartner = () => BizDialog.onOpen('添加合作伙伴', <AddPartner/>);

  render() {
    const {DS, loading, hasMore, landed, load} = this.store;
    const {type} = this.props;
    const currentUser = this.props.user.user.current;
    const isAdmin = currentUser && (currentUser.is_admin === 1);
    let headerTxt = '';
    let messageA = '';
    let noDataTxt = '';
    let leftIcon = null;
    let menuItem = [];
    switch (type) {
      default: return;
      case ListType.PARTNERS:
        headerTxt = '合作伙伴';
        noDataTxt = '暂无合作伙伴';
        leftIcon = <PartnerIcon />;
        menuItem = isAdmin ? [
          {name: '查看/修改资料', action: partner => BizDialog.onOpen('合作伙伴详情', <AddPartner partner={partner}/>)},
          {name: '解除合作关系', action: partner => BizDialog.onOpen('确认解除？', <ConfirmDialog submitAction={partnerStore.onDelete.bind(null, partner)}/>)}
        ] : [
          {name: '查看资料', action: partner => BizDialog.onOpen('合作伙伴详情', <AddPartner partner={partner}/>)},
        ];
        break;
      case ListType.INVITE:
        headerTxt = '伙伴申请';
        noDataTxt = '暂无申请';
        messageA = '申请成为合作伙伴';
        leftIcon = <MailIcon />;
        menuItem = [
          {name: '同意', action: InvitationStore.accept},
          {name: '拒绝', action: InvitationStore.refuse}
        ];
        break;
      case ListType.IN_CHARGE:
        headerTxt = '我负责的商户';
        noDataTxt = '暂无负责商户';
        leftIcon = <PartnerIcon />;
        menuItem = [
          {name: '查看资料', action: partner => BizDialog.onOpen('合作伙伴详情', <AddPartner partner={partner}/>)},
        ];
        break;
    }
    const isInvite = type === ListType.INVITE;
    const isPartnerList = type === ListType.PARTNERS;
    return (
      <List style={{width: 400, marginRight: 10}}>
        <div style={{backgroundColor: '#FFF'}}>
          <Subheader >{headerTxt}</Subheader>
          {loading && !landed && <CircularProgress size={28} style={{display: 'block', margin: '0 auto', paddingBottom: 20}}/>}
          {!DS.length && !loading && <p className="none-data" style={{textAlign: 'center', paddingBottom: 20}}>{noDataTxt}</p>}
          {(DS.length > 0) && <Divider inset={true} />}
        </div>
        <div style={{overflowY: 'auto', height: '90%'}}>
          {
            DS.map((item, index) => (
              <div key={index} style={{backgroundColor: '#FFF'}}>
                <ListItem
                  leftIcon={leftIcon}
                  rightIconButton={(
                    <IconMenu iconButtonElement={iconButtonElement}>
                      {menuItem.map((menu, key) => <MenuItem onTouchTap={menu.action.bind(null, item)} key={key}>{menu.name}</MenuItem>)}
                    </IconMenu>
                  )}
                  primaryText={this.getPrimaryText(type, item)}
                  secondaryText={this.getSecondaryText(type, item)}
                  secondaryTextLines={2}
                />
                {((DS.length - 1) !== index) && <Divider inset={true} />}
              </div>
            ))
          }
          {isPartnerList && (
            <div style={{backgroundColor: '#FFF', textAlign: 'right'}}>
              {(isAdmin || hasMore) && <Divider inset={true} />}
              {isAdmin && <FlatButton label="添加合作伙伴" primary={true} onTouchTap={this.handleAddPartner}/>}
              {hasMore && <FlatButton label="加载更多" primary={true} onTouchTap={load}/>}
            </div>
          )}
        </div>
      </List>
    );
  }
  getPrimaryText = (type, data) => {
    switch (type) {
      default: return '';
      case ListType.INVITE: return `商户(ID): ${data.src_mer_id}`;
      case ListType.PARTNERS: return `商户名(内部): ${data.inner_partner_name}`;
      case ListType.IN_CHARGE: return `商户: ${data.partner_name} (ID: ${data.partner_id})`;
    }
  }
  getSecondaryText = (type, data) => {
    switch (type) {
      default: return '';
      case ListType.INVITE: return (<p><span>申请成为合作伙伴</span><br/>{data.create_time}</p>);
      case ListType.PARTNERS: return (
        <p>
          <span>{`伙伴标识：${!!data.partner_flag ? getPartnerFlag(data.partner_flag) : '暂无'}`}</span>
          <br/>
          {`伙伴类型：${!!data.partner_type ? getPartnerType(data.partner_type) : '暂无'}`}
        </p>
      );
      case ListType.IN_CHARGE: return (
        <p>
          <span>{`伙伴标识：${!!data.partner_flag ? getPartnerFlag(data.partner_flag) : '暂无'}`}</span>
          <br/>
          {`联系方式：${data.tel || '暂无'}`}
        </p>
      );
    }
  }
}

class SearchState {
  @observable keyword = '';
  @observable searchResult = [];
  @observable searching = false;

  @computed get searchValidated() {
    return !!this.keyword;
  }

  @action input = val => this.keyword = val;

  @action search = async () => {
    if (this.searching || !this.searchValidated) return;
    this.searching = true;
    try {
      const resp = await MerchantSvc.searchMerchant(this.keyword);
      runInAction('after search', () => {
        if (resp.code === '0' && resp.data.length) {
          Toast.show('搜索成功');
          this.searchResult = [...resp.data];
        } else {
          this.searchResult = [];
          Toast.show(resp.msg || '没有找到相关商户');
        }
      });
    } catch (e) {
      console.log(e, 'search merchant');
      Toast.show('没有找到相关商户');
    }
    this.searching = false;
  }
}

@observer
class Search extends React.Component {
  store = new SearchState();

  render() {
    const {title} = this.props;
    return (
      <form className="board-search" onSubmit={this.handleSubmit} style={{maxWidth: 400, height: '90%', overflowY: 'auto'}}>
        <h3>{title}</h3>
        <TextField
          floatingLabelText="请输入查找的关键字"
          value={this.store.keyword}
          type="text"
          onChange={e => this.store.input(e.target.value)}
          style={{marginRight: 20}}
        />
        <RaisedButton label="查找" primary={this.store.searchValidated} icon={<SearchIcon />}
                      disabled={!this.store.searchValidated} onTouchTap={this.store.search}/>
        <br/>
        {this.store.searching && <CircularProgress size={28} style={{display: 'block', margin: '20px auto'}}/>}
        <div style={{width: 400, marginTop: 20}}>
          {!!this.store.searchResult.length && this.store.searchResult.map((item, index) => (
            <div key={index} style={{backgroundColor: '#FFF'}}>
              <ListItem
                leftIcon={<MerchantIcon/>}
                // rightIconButton={(
                //   <IconMenu iconButtonElement={iconButtonElement}>
                //     <MenuItem onTouchTap={() => null}>邀请合作</MenuItem>
                //   </IconMenu>
                // )}
                primaryText={`商户名: ${item.mer_name}`}
                secondaryText={`id: ${item.mer_id}`}
                secondaryTextLines={1}
              />
              {((this.store.searchResult.length - 1) !== index) && <Divider inset={true} />}
            </div>
          ))}
        </div>
      </form>
    );
  }
  handleSubmit = (e) => {
    e.preventDefault();
    this.store.search();
  }
}