const ProjectionsConfigProvider = superclass => class extends superclass {
  get projections() {
    return this._projections
  }

  projection(projectionName) {
    return this.projections[projectionName.pascalize()]
  }
}

export default ProjectionsConfigProvider
