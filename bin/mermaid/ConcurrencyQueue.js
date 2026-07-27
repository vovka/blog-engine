export class ConcurrencyQueue {
  constructor(limit = 2) {
    this.limit = limit;
    this.active = 0;
    this.waiting = [];
  }

  run(task) {
    return new Promise((resolve, reject) => {
      this.waiting.push({ task, resolve, reject });
      this.#drain();
    });
  }

  #drain() {
    while (this.active < this.limit && this.waiting.length) this.#start(this.waiting.shift());
  }

  #start(job) {
    this.active += 1;
    Promise.resolve().then(job.task).then(job.resolve, job.reject).finally(() => {
      this.active -= 1;
      this.#drain();
    });
  }
}
