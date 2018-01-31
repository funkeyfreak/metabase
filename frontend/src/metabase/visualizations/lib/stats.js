import jStat from "jStat";

//TODO: funkeyfreak - import/place visualization props and functions here


const TIMESERIES_UNITS = new Set([
    "minute",
    "hour",
    "day",
    "week",
    "month",
    "quarter",
    "year" // https://github.com/metabase/metabase/issues/1992
]);

export default class Stats {
    constructor(scalars){
        const arrInt = Array.from(scalars, s => s.value);
        if (arrInt.length !== 0){
            this.jstatInstance = jStat( arrInt );
        } else {
            //TODO: make checking more robust
            this.jstatInstance = jStat( scalars );
        }
        const tjs = this.jstatInstance;
        this.range = tjs.range();
        this.median = tjs.median();
        this.min = tjs.min();
        this.max = tjs.max();
        this.stDev = tjs.stdev();
    }
    average(){
        return this.median;
    }
    normalCDF(v : number){
        return this.jstatInstance.normal.cdf(v, this.median, this.stDev);
    }
    normalPDF(v : number){
        return this.jstatInstance.normal.pdf(v, this.median, this.stDev);
    }
    normal( v ){
        const tjs = this.jstatInstance;
        const normalDist = {
            mean: tjs.normal.mean(),
            median: tjs.normal.median(),
            mode: tjs.normal.mode(),
            cdf: null,
            pdf: null
        };
        if (v != null || v !== undefined || !isNaN(v)){
            normalDist.cdf = tjs.normal.pdf(v, this.median, this.stDev);
            normalDist.pdf = tjs.normal.pdf(v, this.median, this.stDev);
        }
        return normalDist;
    }
}

/*
type scalarMaths = {

};

function deligate(scalars) {
    const numbers = jstat.
}


function average(arr : [number]){
    let mi = 0, ma = 0, su = 0;
    for(let item in arr){
        su = item+su;
        mi = Math.min(mi, item);
        ma = Math.max(ma, item);
    };

    const sum = su;
    const min = mi;
    const max = ma;
    const range = min - max;
    const L = arr.length;
    const avg = arr.reduce(sum)/L;
    const avgSum = (a, c) => (a+Math.pow(2, c - avg));
    const popStdDev = Math.sqrt(arr.reduce(avgSum)/(L));
    const sampleStdDev = Math.sqrt(arr.reduce(avgSum)/(L-1));

    //NOTE: We currently take the difference between two scalars as `1,` no matter the diff between the date
    //TODO: funkeyfreak - calculate the difference between dates - it will make for a better and more accurate x value
    const x = 1;
    //const sumSqr = ;
}

//Assumes that all scalars are are sorted by date
function datediff(scalars, TimeUnits : string){
    const tu = (TIMESERIES_UNITS.has(TimeUnits) ? TimeUnits : "day")
    let first = scalars[0].date;

    for(let s in scalars){
        let { name, value, date } = scalars;
        //const x
    }
}*/

