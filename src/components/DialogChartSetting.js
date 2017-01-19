import React from 'react';
import { connect } from 'react-redux';
import { Button, Row, Col, Select, Modal, Tabs, Spin, Checkbox, Input, Radio } from 'antd';
const Option = Select.Option;
const TabPane = Tabs.TabPane;
import CustomCharts from './CustomCharts';
import ChartsDetailSetting from './ChartsDetailSetting';
const RadioButton = Radio.Button;
const RadioGroup = Radio.Group;
import { fetchNormal } from './../actions/normal';

// React.Component
class DialogChartSetting extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            metrics: null,
            chartType: "line",
            hasby: false,
        };
    }

    componentWillMount() {
        this.setState({
            metrics: Array.from(this.props.metrics),
            chartType: this.props.type == "timeseries" ? "line" : this.props.type,
        });
        this.initHasby(this.props.type);
    }

    componentDidMount() {
        this.props.fetchNormal();
    }

    passData(params) {
        let tags = params.host.map(function(item) {
            return item.replace(":", "=")
        });
        let arr = Array.from(this.state.metrics);
        let metric = Object.assign({}, arr[0], {
            aggregator: params.agg,
            by: params.by.length > 0 ? params.by : null,
            tags: tags.length > 0 ? tags : null,
            metric: params.metricName,
        });

        arr[0] = metric;

        this.setState({
            metrics: arr,
        });
    }

    initHasby(chartType) {
        switch (chartType) {
            case "heatmap":
            case "area":
                this.setState({
                    hasby: false,
                });
                break;
            default:
                this.setState({
                    hasby: true,
                });
        }

    }

    genMetricPanelNormal() {
        let panels = this.state.metrics.map(function(item, index) {
            return <ChartsDetailSetting passData={this.passData.bind(this)} key={index} metric={item} hasby={this.state.hasby} />
        }, this);
        return panels;
    }

    changeChartType(event) {
        this.setState({
            chartType: event.target.value,
        });
        this.initHasby(event.target.value);
    }

    render() {
        let panelNormal = this.genMetricPanelNormal();

        return < Modal
            title={this.state.metrics ? "编辑图表" : "添加图表"}
            wrapClassName="vertical-center-modal"
            visible={true}
            onOk={() => this.props.showDialog(false)
            }
            onCancel={() => this.props.showDialog(false)}
            width={960}
            className="dialog"
            style={{ top: 20 }}
            footer={null}
            >

            <Row style={{ paddingTop: 25, }}></Row>


            <CustomCharts
                metrics={this.state.metrics}
                type={this.state.chartType}
                ref="chart_heatmap"
                domProps={{ style: { height: 160, width: 928 }, }} />

            <RadioGroup onChange={this.changeChartType.bind(this)} defaultValue={this.state.chartType} size="large">
                <RadioButton value="column">事件流</RadioButton>
                <RadioButton value="heatmap">热力图</RadioButton>
                <RadioButton value="icon">图标</RadioButton>
                <RadioButton value="pie">饼图</RadioButton>

                <RadioButton value="area">状态值</RadioButton>
                <RadioButton value="table">表格</RadioButton>
                <RadioButton value="line">时间序列</RadioButton>
                <RadioButton value="bar">TopN</RadioButton>

                <RadioButton value="treemap">树状图</RadioButton>
            </RadioGroup>



            <Row style={{ padding: 10, paddingLeft: 0 }}>选择和编辑指标</Row>
            <Tabs className="dialog proTab">
                <TabPane tab="普通模式" key="1">
                    {panelNormal}

                </TabPane>
                <TabPane tab="专家模式" key="2">
                    <div style={{ marginLeft: 20, paddingBottom: 20 }}>
                        <Row type="flex" justify="start">
                            <Col span={5}>
                                <label className="pre">Get</label>
                                <Select style={{ width: 150, }} size="large">
                                    <Option key="1" value="1">lucy</Option>
                                    <Option key="2" value="2">lucy</Option>
                                </Select>
                            </Col>
                            <Col span={5}>
                                <label className="pre" style={{ paddingLeft: 3 }}>From</label>
                                <Select style={{ width: 150, }} size="large">
                                    <Option key="1" value="1">平均值</Option>
                                    <Option key="2" value="2">最小值</Option>
                                    <Option key="3" value="3">最大值</Option>
                                    <Option key="4" value="4">求和</Option>
                                </Select>
                            </Col>
                            <Col span={6}>
                                <label className="pre">Rate<Checkbox style={{ paddingLeft: 20 }}></Checkbox></label>
                                <Select style={{ width: 150, }} size="large">
                                    <Option key="1" value="1">平均值</Option>
                                    <Option key="2" value="2">最小值</Option>
                                    <Option key="3" value="3">最大值</Option>
                                    <Option key="4" value="4">求和</Option>
                                </Select>
                            </Col>
                            <Col span={5}>
                                <label className="pre">By</label>
                                <Select style={{ width: 150, }} size="large">
                                    <Option key="1" value="1">平均值</Option>
                                    <Option key="2" value="2">最小值</Option>
                                    <Option key="3" value="3">最大值</Option>
                                    <Option key="4" value="4">求和</Option>
                                </Select>
                            </Col>

                        </Row>

                    </div>
                </TabPane>


            </Tabs>

            <Row style={{ backgroundColor: '#f1f1f1', height: 60, padding: 20 }}>
                <Col span={20}><Input addonBefore="图表命名" /></Col>
                <Col span={4}>
                    <Button onClick={() => this.showDialog(false)} type="primary" style={{ width: 86, height: 40, position: 'absolute', right: 0, top: -10 }} >保存</Button>
                </Col>
            </Row>

        </Modal >;
    }
}

function mapStateToProps(state) {
    const { allMetrics } = state;
    return {
        allMetrics,
    };
}

// Which action creators does it want to receive by props?
function mapDispatchToProps(dispatch) {
    // bindActionCreators(ActionCreators, dispatch)
    return {
        fetchNormal: (params) => dispatch(fetchNormal(params))
    };
}

// Which action creators does it want to receive by props?
export default connect(
    mapStateToProps,
    mapDispatchToProps,
)(DialogChartSetting);
