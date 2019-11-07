// import chalk from 'chalk';
import chalk from 'chalk';
import execa from 'execa';
import { Command } from './helpers/types';
import path from 'path';
// const cmd = `du -h --max-depth=1`
const colors = [
  'bgBlack',
  'bgRed',
  'bgGreen',
  'bgBlue',
  'bgMagenta',
  'bgCyan',
  'bgBlackBright',
  'bgRedBright',
  'bgGreenBright',
  'bgBlueBright',
  'bgMagentaBright',
  'bgCyanBright',
]
const packageJson = require('../package.json')

export class Run implements Command {
  static new(): Run {
    return new Run()
  }
  private constructor() {}
  async parse(args: string[], depth: number = 1) {
    const base_path = args && args[0]
    const stdout = this.run(base_path, depth)
    return stdout
  }
  async run(base_path = '.', depth: number) {
    const subprocess = await execa('du', [base_path, `--max-depth=${depth}`]);
    if(subprocess.failed){
      console.error("Error");
      return 'Failed'
    }
    const stdout = subprocess.stdout;
    const output = parseStdOut(base_path, stdout)
    const columns = process.stdout.columns
    let cells: string[] = []
    let color_idx = 0
    output.locations.forEach((loc, idx) => {
      const num_cells = Math.floor(columns * loc.percentage)
      let str = ''
      const relative_path = path.relative(base_path, loc.path)
      if(num_cells > (relative_path.length + 2)){
        const padding_length = (num_cells - (relative_path.length + 2))/2
        const padding = bar_base(' ', color_idx).repeat(padding_length)
        str = padding  + bar_base(relative_path, color_idx) + padding
      } else if(num_cells > 0) {
          str = bar_base(' ', color_idx).repeat(num_cells)
      }
      cells.push(str)
      color_idx ++
      if(color_idx >= colors.length){
        color_idx = 0
      }
    })
    cells.sort((a,b) => (b.length - a.length))
    console.log(cells.join(''));
    return ''
  }

}
const bar_base = (str, color_idx: number = 0): string => {return chalk.white[colors[color_idx]].bold(str)}

type Output = {
  total_size: number,
  locations: Location[]
}
type Location = {
  size: number,
  path: string,
  percentage: number
}
function parseStdOut(root_path: string, stdout: string): Output {
  let output: Output = {
    total_size: 0,
    locations: []
  }
  const lines = stdout.split('\n')
  lines.forEach(line => {
    const [string_size, path] = line.split('\t')
    const size = parseFloat(string_size ? string_size : '0')
    if(path === root_path){
      output.total_size = size
    } else {
      output.locations.push({ 
        size: size,
        path: path,
        percentage: 0
      })
    }
  })
  output.locations.forEach(loc => {
    loc.percentage = loc.size / output.total_size
  })
  return output
}
