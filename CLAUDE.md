# Drone Defense Project - Claude Configuration

## Project Overview
This is a drone defense game project inspired by retro SNES gaming excellence. The project uses a multi-agent approach for development.

## Sub-Agent System

### Available Sub-Agents
1. **Product Manager** (`.claude/agents/product-manager.md`)
   - Expert in retro SNES game design
   - Defines features with classic gaming sensibilities
   - Creates specifications and success criteria

2. **Game Developer Engineer** (`.claude/agents/game-developer.md`)
   - Expert programmer with game development focus
   - Implements features with high code quality
   - Balances rapid iteration with maintainability

3. **Quality Assurance** (`.claude/agents/quality-assurance.md`)
   - Ensures specification compliance
   - Verifies test coverage and code quality
   - Guards against obvious problems

### Agent Coordination
Agents follow the workflow defined in `.claude/agents/coordination-workflow.md`:
- Product Manager leads planning
- Developer leads implementation
- QA leads verification
- Clear handoff points and communication flows

## Development Workflow

### When Starting a New Feature
1. Invoke Product Manager agent to create feature specification
2. Invoke Developer agent to implement based on spec
3. Invoke QA agent to verify implementation
4. Iterate based on QA feedback

### Quality Standards
- Core game systems need test coverage
- No game-breaking bugs
- Performance must meet target framerate
- Code should follow game programming best practices

## Technical Guidelines

### Testing Requirements
- Run tests before marking any task complete
- Ensure basic test coverage for new features
- Check for obvious issues (memory leaks, crashes, infinite loops)

### Code Organization
- Follow game programming patterns (ECS, State Machines, etc.)
- Keep game logic separate from rendering
- Document complex systems
- Optimize for both development speed and runtime performance

## Project-Specific Context
- Building a drone defense game
- Emphasis on retro gaming quality and feel
- Focus on tight controls and satisfying gameplay
- Balance modern development with classic design principles

## Commands to Run
When implementing features, always run:
- Test suite (once established)
- Linting/formatting tools (once configured)
- Build verification

## Important Notes
- Each agent has specific expertise - use them for their strengths
- Agents should coordinate, not work in isolation
- Quality is everyone's responsibility
- Player experience drives all decisions

Remember: We're creating a game that would make SNES-era developers proud while using modern development practices.