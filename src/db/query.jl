module Query
  include("../config/app.jl")
  using Debugger
  using LibPQ
  using .Config.App

  export create_database

  function create_database(db_name::String=db_name())
    conn = LibPQ.Connection("dbname=postgres")
    execute(conn, "CREATE DATABASE $(db_name)")
  end

  function create_table(table_name)
    conn = LibPQ.Connection("dbname=$(db_name())")
    execute(conn, "CREATE TABLE IF NOT EXISTS $(table_name) (ID )")
  end
end

export Query
