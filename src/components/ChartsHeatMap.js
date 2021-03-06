import ReactHighcharts from 'react-highcharts';
import React from 'react';
import { PropTypes } from 'react';
import { fetchMetric } from './../actions/metric';
import { connect } from 'react-redux';
import { Button, Row, Col, Select, Form, Icon, Card, Modal, Dropdown, Menu, Spin } from 'antd';
import { retryFetch } from './../utils/cFetch'
import { API_CONFIG } from './../config/api';
import cookie from 'js-cookie';
import { setChartSelection } from './../actions/chart';
import ReactDOM from 'react-dom';
import moment from 'moment';
import ChartsBase from './ChartsBase';

//import highchartsHeatmap from 'highcharts-heatmap';
//highchartsHeatmap(ReactHighcharts.Highcharts);

// React.Component
class ChartsHeatMap extends ChartsBase {
    static propTypes = {
        fetchMetric: React.PropTypes.func,
        metric: React.PropTypes.any
    };

    constructor(props) {
        super(props);
    }

    componentWillReceiveProps(nextProps) {
        if (nextProps.chart.range != this.props.chart.range
            || this.props.metrics != nextProps.metrics) {
            this.doFetchData(nextProps, true);
        }

    }

    doFetchDataInner(startDate, endDate, chart) {
        let metrics = chart.metrics;

        this.setState({
            network: {
                isFetching: true,
                data: [],
                error: null,
            }
        });
        this.state.network.lastTime = endDate;

        let metricInfo = metrics[0];
        let interval = 3600;
        if (this.props.chart.range.startDate <= 3600000 * 24) {
            interval = 60;
        }


        let queries = [];
        for (let metricInfo of metrics) {

            let metric = { begin: (endDate - startDate) / 1000, end: endDate / 1000, interval: interval, attributes: { index: metrics.indexOf(metricInfo) } };
            let q = "";

            queries.push(metric);

            q += metricInfo.aggregator;

            if (metricInfo.rate) {
                q += ":rate";
            }

            q += ":" + metricInfo.metric;
            //avg:system.load.1
            let tags = null;

            if (metricInfo.tags) {
                tags = metricInfo.tags.map(function (item) {
                    return item.replace(":", "=")
                });
            }
            if (tags) {
                q += "{" + tags + "}";
            }
            if (!metricInfo.tags) {
                //q += "{*}";
                let qtags = [];
                if (metricInfo.query) {
                    let regex = /^(\w+):(?:(\w+-\w+(?:-(?:\w+))?):)?(?:(rate.*):)?([\w./-]+)(?:\{([^}]+)?\})?(?:(by))?(?:\{([^}]+)?\})?/;
                    let m = regex.exec(metricInfo.query);
                    if (m !== null && m.length > 5) {

                        qtags = m[5].split(",");
                        //console.log(qtags);
                    }
                }
                tags = qtags.map(function (item) {
                    //console.log("===", item);
                    if (props.params[item]) {
                        if (props.params[item].value) {
                            //console.log(props.params[item]);
                            return props.params[item].value.replace(":", "=");
                        } else {
                            return "";
                        }
                    }
                    return item.replace(":", "=")
                });
                if (tags) {
                    q += "{" + tags + "}";
                } else {
                    q += "{}";
                }
            }


            metric.q = q;
        }

        retryFetch(API_CONFIG.metric, {
            method: "POST",
            retries: 3,
            retryDelay: 10000,
            params: {
                /*q: q,
                begin: startDate,
                end: endDate,
                interval: interval,*/
                api_key: API_CONFIG.apiKey,
            },
            ContentType: "application/json",
            body: JSON.stringify({ queries: queries }),
            //body: encodeURIComponent(JSON.stringify({ queries: queries }))
        }).then(function (response) {
            return response.json();
        }).then((json) => {
            if (!this.mounted) {
                return;
            }
            this.setState({
                network: {
                    isFetching: false,
                    data: json.result,
                    error: null,
                    lastTime: endDate,
                }
            });
            //console.log("json", json);
        });


        /*
                //metricInfo.aggregator + ":" +　metricInfo.metric + "{" + metricInfo.tags+"}by{"+metricInfo.by + "}",
                //"avg:system.mem.free{address=wuhan,host=102}by{host}"
        
                this.props.fetchMetric({
                    id: this.props.id,
                    q: q,
                    begin: startDate,
                    end: endDate,
                    interval: startDate / 60000
                });
        */
    }

    /*
    {"metric":"system.mem.free","aggregator":"avg","type":"line",
    "rate":false,"id":1482717404051,
    "tags":["address=wuhan","host=102"],"by":["host"]}
     */
    componentDidUpdate() {
        if (this.state.network.isFetching) {
            if (this.refs.chart)
                this.refs.chart.getChart().showLoading();
        }
        else if (this.state.network.data.length == 0) {
            //this.doFetchData(this.props.startDate, this.props.endDate);
            // this.refs.chart.getChart().showLoading();
        }
    }

    shouldComponentUpdate(nextProps, nextState) {
        let isFetching = this.state.network.isFetching;
        let data = this.state.network.data;

        let isFetching2 = nextState.network.isFetching;
        let data2 = nextState.network.data;

        return data2 != data || isFetching != isFetching2;
    }

    buildSerieName(tags) {
        if (tags == null || tags.length == 0)
            return "*";
        let name = "";
        for (let [key, value] of Object.entries(tags)) {
            if (key == "user")
                continue;
            if (name)
                name += ",";
            name += key + ":" + value;
        }
        if (!name)
            name = "*";
        return name;
    }

    render() {
        if (!this.props.metrics || this.state.network.isFetching) {

            let style = Object.assign({}, this.props.domProps.style, {
                position: 'relative',
            });

            return <div style={style}><div style={{
                position: 'absolute',
                top: '50%',
                left: '50%'
            }}><Spin /></div></div>;

        }
        let metric = this.props.metrics[0];

        let isFetching = this.state.network.isFetching;
        let data = this.state.network.data;

        let series = [];
        let legend = {};

        let chart = this.props.chart;

        let tooltip = {
            backgroundColor: "rgba(0,0,0,0.5)",
            style: {                      // 文字内容相关样式
                color: "#ffffff",
                fontSize: "12px",
                fontWeight: "blod",
                fontFamily: "Courir new"
            },
            formatter: function () {
                //console.log(this);
                let endTime = moment(parseInt(chart.range.endDate));

                let strTime = "";
                //this.props.chart.range.startDate, this.props.chart.range.endDate
                if (chart.range.startDate <= 3600000 * 24) {
                    //y 轴 0~60 分钟
                    //x 轴 就是1~24小时
                    //  console.log(endTime.format("YYYY-MM-DD"));
                    let xMax = parseInt(chart.range.startDate) / 3600000;

                    let time = endTime.subtract(xMax - this.point.x, "hours");
                    //console.log(time.format("YYYY-MM-DD HH:mm:ss"));
                    time = time.subtract(60 - this.point.y, "minutes");
                    //console.log(time.format("YYYY-MM-DD HH:mm:ss"));
                    strTime = time.format("YYYY-MM-DD HH:mm:ss");
                } else {
                    //y 轴 0~24 小时
                    //x 轴 就是1~30天
                    //  console.log(endTime.format("YYYY-MM-DD"));

                }

                return metric.metric + '<br/>{' + strTime + '}<br/>{' + this.point.value.toFixed(2) + '}<br/>';
            },
            shared: true
        };

        let xMin = null;
        let xMax = null;

        let chartType = this.props.type ? this.props.type : metric.type;
        if (data.length > 0) {
            data = data[0].series;
            for (let key in data) {
                let serie = {

                };
                serie.data = [];
                serie.type = this.props.type ? this.props.type : metric.type;
                serie.name = this.buildSerieName(metric.tags);
                serie.showInLegend = false;
                serie.colsize = 1;

                let pointlist = data[key].pointlist;

                for (var keyTime in pointlist) {
                    if (pointlist[keyTime] == null)
                        continue;
                    let tmp = [];


                    //this.props.chart.range.startDate, this.props.chart.range.endDate
                    if (this.props.chart.range.startDate <= 3600000 * 24) {
                        //y 轴 0~60 分钟
                        //x 轴 就是1~24小时
                        xMin = 1;
                        xMax = parseInt(this.props.chart.range.startDate) / 3600000;

                        let endTime = moment(parseInt(this.props.chart.range.endDate));
                        //  console.log(endTime.format("YYYY-MM-DD"));

                        let time = moment(keyTime * 1000);
                        let hour = endTime.diff(time, 'hours');
                        time = time.add(hour, "hours");
                        tmp.push(xMax - hour);
                        tmp.push(60 - endTime.diff(time, 'minutes'));
                        //console.log(time.format("YYYY-MM-DD"));
                        // tmp.push('2013-12-11');





                        tmp.push(pointlist[keyTime]);
                    } else {
                        //y 轴 0~24 小时
                        //x 轴 就是1~30天
                        let endTime = moment(parseInt(this.props.chart.range.endDate));
                        //  console.log(endTime.format("YYYY-MM-DD"));

                        let time = moment(keyTime * 1000);
                        let hour = endTime.diff(time, 'days');
                        time = time.add(hour, "days");
                        tmp.push(hour + 1);
                        tmp.push(endTime.diff(time, 'hours'));
                        //console.log(time.format("YYYY-MM-DD"));
                        // tmp.push('2013-12-11');
                        xMin = 1;
                        xMax = parseInt(this.props.chart.range.startDate) / 3600000 / 24;


                        tmp.push(pointlist[keyTime]);
                    }



                    serie.data.push(tmp);


                    //[129.2, 144.0, 176.0, 135.6, 148.5, 216.4, 194.1, 95.6, 54.4, 29.9, 71.5, 106.4]
                }

                series.push(serie);
                break;
            }
        }

        const config = {
            global: {
                useUTC: false,
            },
            legend: {
                enabled: false
            },
            colors: ['#008acd', '#2ec7c9', '#b6a2de', '#0cc2aa', '#6887ff', '#6cc788'],
            loading: {  // 加载中选项配置
                labelStyle: {
                    fontSize: '12px'
                }
            },
            tooltip: tooltip,
            chart: {

            },
            title: {
                text: null
            },
            colorAxis: { minColor: "rgba(255,255,255,0.9)", maxColor: '#008acd', tickPixelInterval: 1 / 0 },
            plotOptions: {
                heatmap: {
                    marker: {
                        lineWidth: 4,
                        //   lineColor: '#f00',
                        //   fillColor: '#0f0',
                        states: {
                            hover: {
                                halo: !1, brightness: .2,
                                lineColor: "#f00",
                            }
                        },
                    },
                },

            },
            xAxis: {
                min: xMin,
                max: xMax,
            },

            series: series,
            credits: {
                enabled: false // 禁用版权信息
            },
        };

        //console.log(series);

        let domProps = Object.assign({}, this.props.domProps, {
        });

        return <ReactHighcharts ref="chart" config={config} domProps={domProps} />;
    }
}

ChartsHeatMap.childContextTypes = {
    domProps: PropTypes.any,
    chartSelection: PropTypes.func
};

/*
别删 别删 别删 
//
获取connect后的对象 refs.chart.getWrappedInstance()
*/
// Which part of the Redux global state does our component want to receive as props?
function mapStateToProps(state) {
    const { chart } = state;
    return {
        chart
    };
}

// Which action creators does it want to receive by props?

function mapDispatchToProps(dispatch) {
    // bindActionCreators(ActionCreators, dispatch)
    return {
        setChartSelection: (params) => dispatch(setChartSelection(params))
    };
}


export default connect(
    mapStateToProps,
    mapDispatchToProps,
    null, { withRef: true }
)(ChartsHeatMap);
