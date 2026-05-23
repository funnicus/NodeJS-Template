# Rebasing

Using [Lazygit](https://github.com/jesseduffield/lazygit) makes this workflow much easier.

How to implement the workflow:

1. Set `git config pull.rebase true` and `git config merge.ff only` in your local project.

2. Avoid `git add .`, and instead prefer adding and creating commits for files, that contribute to a specific change. For example one for documentation changes and another for the actual feature changes.

3. Use `git reword` to change commit messages, that don't conform to conventional commits.

4. Use `git fixup` to fix broken commits. Each commit should represent a new working version of the application. You can create temporary commits to save your work, but try to merge all related commits to its own separate feature commit before merging.
   1. Follow [this](https://github.com/jesseduffield/lazygit/wiki/Interactive-Rebasing) for merging unstaged changes. In short, stage all files, navigate to your desired commit and press `A` to amend.
   2. If you want to merge two older commits, use Lazygit. Use `ctrl + j` (one down) and `ctrl + k` (one up), to move commits around. Move the desired commit on top of the other commit and then fixup them together.

5. Don't be afraid to use `git push --force` in your **personal branch**, if you rewrite history with any of the previous actions.

6. Use the Git CLI locally to merge your (or your friends) branch to master and then push it to remote. Github does not support fast-forward merges in the web UI.
