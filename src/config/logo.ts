import colors from 'colorette'

export default function logo() {
  return (
    colors.bgMagentaBright(colors.black(
      `
      ,▄█▄                                               
    ]█▄▄                         ╓█████▌                 
    ▐██████▄                   ▄█████▓╣█                 
     ║████████▄,  ,  ,,▄,▄▄▄▓██████╬╬╣╣▌                 
      ╚███╣██████████▓▓▓▓██████████╩╠╬▓                  
       ╙█╬╬╬▓███████████████████████▒▓▌                  `
    )) +
    colors.bgMagentaBright(
      colors.black(`
        ╙▓█▓██████████████████████████                   
         ╚██████▀███████████`) + colors.greenBright(`╩█▓▌`) + colors.black(`▐▓████▄                  
         '║█████`) + colors.greenBright(`\`╣█Γ║`) + colors.black(`████████▄▄φ▓█████▌                  
          ║█████████████████████▓█████▌                  
           █████████████▓▓████████████                   `)) +
    colors.bgMagentaBright(
      colors.black(`
           ║█████████████████████████                    
          ]█████████████████████████                     
         ,▓██████████████████████████                    
        ▓█████████████████████████████µ                  `)
    ) +
    colors.bgMagentaBright(colors.black(`
       ▐███████████████████████████████▄▄                
       ║█████████████████████████████████╬╬╣▓            
   ,╔╦║███████████████████████████████████▓╬╬╣           
,≥≥⌠░░░╠▓████████████████████████████████████▓▓          
,;=-',▄█████████████████████████████████████████▓        `)) +
    colors.bgGreen(
      colors.magenta(
        `
                                                         
                                                         
                                                         
  ██████╗ ███████╗██╗   ██╗ ██████╗██╗  ██╗██╗ ██████╗   
  ██╔══██╗██╔════╝╚██╗ ██╔╝██╔════╝██║  ██║██║██╔════╝   
  ██████╔╝███████╗ ╚████╔╝ ██║     ███████║██║██║        
  ██╔═══╝ ╚════██║  ╚██╔╝  ██║     ██╔══██║██║██║        
  ██║     ███████║   ██║   ╚██████╗██║  ██║██║╚██████╗   
  ╚═╝     ╚══════╝   ╚═╝    ╚═════╝╚═╝  ╚═╝╚═╝ ╚═════╝   
                                                         
                                                         `
      )
    )
  )
}
