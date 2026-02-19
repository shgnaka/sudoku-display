use js_sys::Uint8Array;
use std::sync::Once;
use wasm_bindgen::prelude::*;

const GRID_LEN: usize = 81;
const SIZE: usize = 9;
const BOX_SIZE: usize = 3;
const MAX_PUZZLE_ATTEMPTS: usize = 64;

static PANIC_HOOK: Once = Once::new();

#[wasm_bindgen]
pub struct GeneratedPuzzle {
    puzzle: [u8; GRID_LEN],
    solution: [u8; GRID_LEN],
    clues: u8,
    difficulty: String,
    seed: u64,
}

#[wasm_bindgen]
impl GeneratedPuzzle {
    #[wasm_bindgen(getter)]
    pub fn clues(&self) -> u8 {
        self.clues
    }

    #[wasm_bindgen(getter)]
    pub fn difficulty(&self) -> String {
        self.difficulty.clone()
    }

    #[wasm_bindgen(getter)]
    pub fn seed(&self) -> u64 {
        self.seed
    }

    #[wasm_bindgen(js_name = puzzle)]
    pub fn puzzle_bytes(&self) -> Uint8Array {
        Uint8Array::from(&self.puzzle[..])
    }

    #[wasm_bindgen(js_name = solution)]
    pub fn solution_bytes(&self) -> Uint8Array {
        Uint8Array::from(&self.solution[..])
    }
}

#[wasm_bindgen]
pub fn generate_sudoku(difficulty: &str, seed: u64) -> Result<GeneratedPuzzle, JsValue> {
    init_panic_hook();

    let (normalized, min_clues, max_clues) = parse_difficulty(difficulty)?;
    let mut rng = XorShift64::new(seed);

    for _ in 0..MAX_PUZZLE_ATTEMPTS {
        let mut solution = [0u8; GRID_LEN];
        if !fill_grid(&mut solution, &mut rng) {
            continue;
        }

        let target_clues = rng.random_range_inclusive(min_clues, max_clues);
        let mut puzzle = solution;

        carve_puzzle(&mut puzzle, target_clues as usize, &mut rng);

        let clues = count_clues(&puzzle);
        if clues < min_clues as usize || clues > max_clues as usize {
            continue;
        }

        if count_solutions(&puzzle, 2) != 1 {
            continue;
        }

        return Ok(GeneratedPuzzle {
            puzzle,
            solution,
            clues: clues as u8,
            difficulty: normalized,
            seed,
        });
    }

    Err(JsValue::from_str(
        "数独の生成に失敗しました。時間をおいて再試行してください。",
    ))
}

fn init_panic_hook() {
    PANIC_HOOK.call_once(console_error_panic_hook::set_once);
}

fn parse_difficulty(input: &str) -> Result<(String, u8, u8), JsValue> {
    match input.trim().to_ascii_lowercase().as_str() {
        "easy" => Ok(("easy".to_string(), 36, 42)),
        "medium" => Ok(("medium".to_string(), 32, 35)),
        "hard" => Ok(("hard".to_string(), 28, 31)),
        _ => Err(JsValue::from_str(
            "difficulty は easy / medium / hard のいずれかを指定してください。",
        )),
    }
}

fn idx(row: usize, col: usize) -> usize {
    row * SIZE + col
}

fn is_valid(grid: &[u8; GRID_LEN], row: usize, col: usize, value: u8) -> bool {
    for i in 0..SIZE {
        if grid[idx(row, i)] == value || grid[idx(i, col)] == value {
            return false;
        }
    }

    let box_row = (row / BOX_SIZE) * BOX_SIZE;
    let box_col = (col / BOX_SIZE) * BOX_SIZE;

    for r in box_row..(box_row + BOX_SIZE) {
        for c in box_col..(box_col + BOX_SIZE) {
            if grid[idx(r, c)] == value {
                return false;
            }
        }
    }

    true
}

fn find_best_empty_cell(grid: &[u8; GRID_LEN]) -> Option<(usize, [u8; SIZE], usize)> {
    let mut best: Option<(usize, [u8; SIZE], usize)> = None;

    for position in 0..GRID_LEN {
        if grid[position] != 0 {
            continue;
        }

        let row = position / SIZE;
        let col = position % SIZE;
        let mut candidates = [0u8; SIZE];
        let mut count = 0usize;

        for value in 1..=9 {
            if is_valid(grid, row, col, value) {
                candidates[count] = value;
                count += 1;
            }
        }

        match best {
            None => best = Some((position, candidates, count)),
            Some((_, _, best_count)) if count < best_count => {
                best = Some((position, candidates, count));
            }
            _ => {}
        }

        if count <= 1 {
            break;
        }
    }

    best
}

fn fill_grid(grid: &mut [u8; GRID_LEN], rng: &mut XorShift64) -> bool {
    let Some((position, mut candidates, count)) = find_best_empty_cell(grid) else {
        return true;
    };

    if count == 0 {
        return false;
    }

    shuffle_prefix(&mut candidates, count, rng);

    for value in candidates.iter().take(count) {
        grid[position] = *value;
        if fill_grid(grid, rng) {
            return true;
        }
    }

    grid[position] = 0;
    false
}

fn solve_count(grid: &mut [u8; GRID_LEN], solutions: &mut u32, limit: u32) {
    if *solutions >= limit {
        return;
    }

    let Some((position, candidates, count)) = find_best_empty_cell(grid) else {
        *solutions += 1;
        return;
    };

    if count == 0 {
        return;
    }

    for value in candidates.iter().take(count) {
        grid[position] = *value;
        solve_count(grid, solutions, limit);
        if *solutions >= limit {
            grid[position] = 0;
            return;
        }
    }

    grid[position] = 0;
}

fn count_solutions(grid: &[u8; GRID_LEN], limit: u32) -> u32 {
    let mut clone = *grid;
    let mut solutions = 0u32;
    solve_count(&mut clone, &mut solutions, limit);
    solutions
}

fn carve_puzzle(puzzle: &mut [u8; GRID_LEN], target_clues: usize, rng: &mut XorShift64) {
    let mut positions = [0usize; GRID_LEN];
    for (i, position) in positions.iter_mut().enumerate() {
        *position = i;
    }
    shuffle_positions(&mut positions, rng);

    for position in positions {
        if count_clues(puzzle) <= target_clues {
            break;
        }

        let previous = puzzle[position];
        puzzle[position] = 0;

        if count_solutions(puzzle, 2) != 1 {
            puzzle[position] = previous;
        }
    }
}

fn count_clues(grid: &[u8; GRID_LEN]) -> usize {
    grid.iter().filter(|value| **value != 0).count()
}

fn shuffle_prefix(values: &mut [u8; SIZE], len: usize, rng: &mut XorShift64) {
    if len <= 1 {
        return;
    }

    for i in (1..len).rev() {
        let j = rng.random_usize(i + 1);
        values.swap(i, j);
    }
}

fn shuffle_positions(values: &mut [usize; GRID_LEN], rng: &mut XorShift64) {
    for i in (1..GRID_LEN).rev() {
        let j = rng.random_usize(i + 1);
        values.swap(i, j);
    }
}

struct XorShift64 {
    state: u64,
}

impl XorShift64 {
    fn new(seed: u64) -> Self {
        let normalized = if seed == 0 {
            0x9E37_79B9_7F4A_7C15
        } else {
            seed
        };
        Self { state: normalized }
    }

    fn next_u64(&mut self) -> u64 {
        let mut x = self.state;
        x ^= x << 13;
        x ^= x >> 7;
        x ^= x << 17;
        self.state = x;
        x
    }

    fn random_usize(&mut self, upper_bound: usize) -> usize {
        if upper_bound <= 1 {
            return 0;
        }

        (self.next_u64() as usize) % upper_bound
    }

    fn random_range_inclusive(&mut self, min: u8, max: u8) -> u8 {
        let span = (max - min + 1) as usize;
        min + self.random_usize(span) as u8
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    fn is_valid_solution(grid: &[u8; GRID_LEN]) -> bool {
        for row in 0..SIZE {
            let mut seen = [false; 10];
            for col in 0..SIZE {
                let value = grid[idx(row, col)] as usize;
                if value == 0 || seen[value] {
                    return false;
                }
                seen[value] = true;
            }
        }

        for col in 0..SIZE {
            let mut seen = [false; 10];
            for row in 0..SIZE {
                let value = grid[idx(row, col)] as usize;
                if value == 0 || seen[value] {
                    return false;
                }
                seen[value] = true;
            }
        }

        for box_row in (0..SIZE).step_by(BOX_SIZE) {
            for box_col in (0..SIZE).step_by(BOX_SIZE) {
                let mut seen = [false; 10];
                for row in box_row..(box_row + BOX_SIZE) {
                    for col in box_col..(box_col + BOX_SIZE) {
                        let value = grid[idx(row, col)] as usize;
                        if value == 0 || seen[value] {
                            return false;
                        }
                        seen[value] = true;
                    }
                }
            }
        }

        true
    }

    #[test]
    fn generates_valid_solution() {
        let mut rng = XorShift64::new(42);
        let mut solution = [0u8; GRID_LEN];
        let generated = fill_grid(&mut solution, &mut rng);

        assert!(generated);
        assert!(is_valid_solution(&solution));
    }

    #[test]
    fn puzzle_has_unique_solution() {
        let result = generate_sudoku("medium", 12345).expect("should generate puzzle");
        assert_eq!(count_solutions(&result.puzzle, 2), 1);
    }

    #[test]
    fn clue_range_matches_difficulty() {
        let easy = generate_sudoku("easy", 1).expect("easy generation should succeed");
        assert!((36..=42).contains(&easy.clues));

        let medium = generate_sudoku("medium", 2).expect("medium generation should succeed");
        assert!((32..=35).contains(&medium.clues));

        let hard = generate_sudoku("hard", 3).expect("hard generation should succeed");
        assert!((28..=31).contains(&hard.clues));
    }

    #[test]
    fn generation_is_deterministic_with_same_seed() {
        let first = generate_sudoku("hard", 999).expect("first generation should succeed");
        let second = generate_sudoku("hard", 999).expect("second generation should succeed");

        assert_eq!(first.puzzle, second.puzzle);
        assert_eq!(first.solution, second.solution);
        assert_eq!(first.clues, second.clues);
    }
}
