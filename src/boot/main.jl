include("../db/query.jl")
include("../../app/migrate/01_create_users.jl")

using Debugger
# using .DB.Query
# @run create_database()
CreateUsersMigration.up()
