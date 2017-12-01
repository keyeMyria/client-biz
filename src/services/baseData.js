import axios from './index';

const updateUser = async (id, name, dep_id) => {
  const resp = await axios.post('/base_gateway/update_user', {id, name, dep_id});
  return resp.data;
};

const getUser = async (id) => {
  const resp = await axios.post('/base_gateway/query_user', {id});
  return resp.data;
};

const getUserList = async (id) => {
  const resp = await axios.post('/base_gateway/batch_query_user', {id});
  return resp.data;
};


const addDepartment = async (name, parent_id) => {
  const resp = await axios.post('/base_gateway/add_department', {name, parent_id});
  return resp.data;
};

const getDepartmentList = async () => {
  const resp = await axios.post('/base_gateway/batch_query_department');
  return resp.data;
};

const getDepartment = async (id, parent_id) => {
  const resp = await axios.post('/base_gateway/query_department', {id, parent_id});
  return resp.data;
};

const delDepartment = async (id) => {
  const resp = await axios.post('/base_gateway/del_department', {id});
  return resp.data;
};

const updateDepartment = async (id, name, parent_id, remark) => {
  const resp = await axios.post('/base_gateway/update_department', {id, name, parent_id, remark});
  return resp.data;
};

const addItem = async (item_name, item_code, item_spec, unit, price, item_func, partner_item_list) => {
  const resp = await axios.post('/base_gateway/add_item', {item_name, item_code, item_spec, unit, price, item_func, partner_item_list});
  return resp.data;
};

const updateItem = async (item_id, item_name, item_code, item_spec, unit, price, item_func, partner_item_list) => {
  const resp = await axios.post('/base_gateway/update_item', {item_id, item_name, item_code, item_spec, unit, price, item_func, partner_item_list});
  return resp.data;
};

const delItem = async (item_id) => {
  const resp = await axios.post('/base_gateway/del_item', {item_id});
  return resp.data;
};

const getItemList = async (page_no, page_size) => {
  const resp = await axios.post('/base_gateway/batch_query_item', {page_no, page_size});
  return resp.data;
};

const getItem = async (item_id) => {
  const resp = await axios.post('/base_gateway/query_item', {item_id});
  return resp.data;
};

export const SearchType = {
  ITEM_NO: 1,
  NAME: 2,
  PARTNER: 3,
  ALL: 5,
};

const searchItem = async (keyword, search_type) => {
  let config = {keyword, search_type};
  if (search_type === SearchType.ALL) config = {keyword};
  const resp = await axios.post('/base_gateway/search_item_selective', config);
  return resp.data;
};

const addPartner = async (partner_id, partner_flag, partner_type, inner_partner_id, inner_partner_name, tel, address) => {
  const resp = await axios.post('/base_gateway/add_partner', {partner_id, partner_flag, partner_type, inner_partner_id, inner_partner_name, tel, address});
  return resp.data;
};

const delPartner = async (partner_id) => {
  const resp = await axios.post('/base_gateway/del_partner', {partner_id});
  return resp.data;
};

const updatePartner = async (partner_id, partner_flag, partner_type, inner_partner_id, inner_partner_name, tel, address) => {
  const resp = await axios.post('/base_gateway/update_partner', {partner_id, partner_flag, partner_type, inner_partner_id, inner_partner_name, tel, address});
  return resp.data;
};

const getPartnerList = async (page_no, page_size) => {
  const resp = await axios.post('/base_gateway/batch_query_partner', {page_no, page_size});
  return resp.data;
};

const getPartner = async (partner_id) => {
  const resp = await axios.post('/base_gateway/query_partner', {partner_id});
  return resp.data;
};

export default {
  updateUser,
  getUser,
  getUserList,
  addDepartment,
  getDepartmentList,
  getDepartment,
  delDepartment,
  updateDepartment,
  addItem,
  updateItem,
  delItem,
  getItemList,
  addPartner,
  delPartner,
  updatePartner,
  getPartnerList,
  getPartner,
  getItem,
  searchItem,
}
