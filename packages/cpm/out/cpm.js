class Duration {
    low;
    likely;
    high;
    constructor(low, likely, high) {
        const values = [low, likely, high].filter((v) => v > 0);
        if (values.length === 0) {
            this.low = this.likely = this.high = 0; // milestone
        }
        else if (values.length === 1) {
            this.low = this.likely = this.high = values[0];
        }
        else if (values.length === 2) {
            const avg = (values[0] + values[1]) / 2;
            this.low = low > 0 ? low : avg;
            this.likely = likely > 0 ? likely : avg;
            this.high = high > 0 ? high : avg;
        }
        else {
            this.low = low;
            this.likely = likely;
            this.high = high;
        }
    }
    get expected() {
        return (this.low + 4 * this.likely + this.high) / 6;
    }
    get variance() {
        return ((this.high - this.low) / 6) ** 2;
    }
}
class Task {
    id;
    duration;
    successors;
    predecessors = [];
    earliestStart = 0;
    earliestFinish = 0;
    latestStart = Infinity;
    latestFinish = Infinity;
    pathVariance = 0;
    constructor(id, duration, successors) {
        this.id = id;
        this.duration = duration;
        this.successors = successors;
    }
    get slack() {
        return this.latestStart - this.earliestStart;
    }
    get isCritical() {
        // Using a tolerance because floating point math accumulates errors.
        return Math.abs(this.slack) < 0.001;
    }
}
export const runCpm = async (taskList) => {
    const tasks = new Map();
    for (const t of taskList) {
        const duration = new Duration(t.durationLow || 0, t.durationLikely || 0, t.durationHigh || 0);
        tasks.set(t.id, new Task(t.id, duration, t.successors));
    }
    // Check for missing successors.
    const missingSuccessors = [];
    for (const task of tasks.values()) {
        for (const succId of task.successors) {
            if (!tasks.has(succId) && !missingSuccessors.includes(succId)) {
                missingSuccessors.push(succId);
            }
        }
    }
    if (missingSuccessors.length > 0) {
        return {
            error: 'Missing successor tasks',
            missingSuccessors,
        };
    }
    // Build predecessors list.
    for (const task of tasks.values()) {
        for (const succId of task.successors) {
            const succ = tasks.get(succId);
            if (succ)
                succ.predecessors.push(task.id);
        }
    }
    // Topological sort and check cycles.
    const order = [];
    const inDegree = new Map();
    for (const t of tasks.values())
        inDegree.set(t.id, 0);
    for (const t of tasks.values()) {
        for (const s of t.successors) {
            inDegree.set(s, (inDegree.get(s) ?? 0) + 1);
        }
    }
    const queue = [];
    for (const [id, deg] of inDegree.entries()) {
        if (deg === 0)
            queue.push(id);
    }
    while (queue.length > 0) {
        const id = queue.shift();
        order.push(id);
        for (const succ of tasks.get(id).successors) {
            const d = (inDegree.get(succ) ?? 0) - 1;
            inDegree.set(succ, d);
            if (d === 0)
                queue.push(succ);
        }
    }
    if (order.length !== tasks.size)
        return { error: 'Graph contains a cycle' };
    // Forward pass (earliest times + path variance propagation).
    for (const id of order) {
        const task = tasks.get(id);
        task.earliestStart = 0;
        task.pathVariance = 0;
        for (const predId of task.predecessors) {
            const pred = tasks.get(predId);
            if (pred.earliestFinish > task.earliestStart) {
                task.earliestStart = pred.earliestFinish;
                task.pathVariance = pred.pathVariance;
            }
            else if (pred.earliestFinish === task.earliestStart &&
                pred.pathVariance > task.pathVariance) {
                task.pathVariance = pred.pathVariance;
            }
        }
        task.pathVariance += task.duration.variance;
        task.earliestFinish = task.earliestStart + task.duration.expected;
    }
    // Backward pass (latest, slack).
    const maxEF = Math.max(...order.map((id) => tasks.get(id).earliestFinish));
    const revOrder = order.slice().reverse();
    for (const id of revOrder) {
        const task = tasks.get(id);
        if (task.successors.length === 0) {
            task.latestFinish = maxEF;
        }
        else {
            task.latestFinish = Math.min(...task.successors.map((s) => tasks.get(s).latestStart));
        }
        task.latestStart = task.latestFinish - task.duration.expected;
    }
    // Critical path collection (can be more than one).
    const paths = [];
    function dfs(path, id) {
        const task = tasks.get(id);
        if (!task.isCritical)
            return;
        const newPath = path.concat([id]);
        if (task.successors.length === 0) {
            paths.push(newPath);
            return;
        }
        for (const succ of task.successors) {
            dfs(newPath, succ);
        }
    }
    for (const id of order) {
        const t = tasks.get(id);
        if (t.predecessors.length === 0 && t.isCritical) {
            dfs([], id);
        }
    }
    // Edge output with criticality boolean.
    const edgeSet = new Set();
    for (const path of paths) {
        for (let i = 0; i < path.length - 1; i++) {
            edgeSet.add(path[i] + ' > ' + path[i + 1]);
        }
    }
    const edgeList = [];
    for (const task of tasks.values()) {
        for (const succ of task.successors) {
            const key = task.id + ' > ' + succ;
            edgeList.push({
                id: key,
                from: task.id,
                to: succ,
                isCritical: edgeSet.has(key),
            });
        }
    }
    const taskOut = [];
    for (const task of tasks.values()) {
        taskOut.push({
            id: task.id,
            expectedDuration: task.duration.expected,
            variance: task.duration.variance,
            pathVariance: task.pathVariance,
            earliestStart: task.earliestStart,
            earliestFinish: task.earliestFinish,
            latestStart: task.latestStart,
            latestFinish: task.latestFinish,
            slack: task.slack,
            isCritical: task.isCritical,
        });
    }
    const pathOut = [];
    for (const path of paths) {
        let exp = 0.0, varSum = 0.0;
        for (const id of path) {
            const t = tasks.get(id);
            exp += t.duration.expected;
            varSum += t.duration.variance;
        }
        const stddev = Math.sqrt(varSum);
        pathOut.push({
            path,
            expectedDuration: exp,
            variance: varSum,
            stddev: stddev,
            confidence95: {
                lower: exp - 2 * stddev,
                upper: exp + 2 * stddev,
            },
        });
    }
    return roundAllNumbersImmutable({
        tasks: taskOut,
        edges: edgeList,
        criticalPaths: pathOut,
    });
};
const roundAllNumbersImmutable = (obj) => {
    if (typeof obj === 'number') {
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        return Number(obj.toFixed(1));
    }
    if (Array.isArray(obj)) {
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        return obj.map((item) => roundAllNumbersImmutable(item));
    }
    if (typeof obj === 'object' && obj !== null) {
        const newObj = {};
        for (const key in obj) {
            if (Object.prototype.hasOwnProperty.call(obj, key)) {
                // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                // @ts-ignore
                newObj[key] = roundAllNumbersImmutable(obj[key]);
            }
        }
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        return newObj;
    }
    // Return primitives as-is.
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    return obj;
};
//# sourceMappingURL=cpm.js.map