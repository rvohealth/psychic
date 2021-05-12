module Migrate
  using Debugger
  include("../db/query.jl")
  # using .Query

  arr = []
  with_column(column) = push!(arr, column)

  function create_table(cb, table)
    cb()
    @bp
    # Query.create_table(table)
  end
end
